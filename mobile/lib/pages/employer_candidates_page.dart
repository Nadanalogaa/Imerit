import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../store/applications_provider.dart';
import '../store/auth_provider.dart';
import '../store/employer_prefs_provider.dart';
import '../store/jobs_provider.dart';
import '../store/locations_provider.dart';
import '../store/profile_provider.dart';
import '../store/subscriptions_provider.dart';
import '../store/theme_provider.dart';
import '../widgets/candidate_filter_sheet.dart';
import '../widgets/employer/recently_viewed_strip.dart';
import '../widgets/employer/saved_search_strip.dart';
import '../widgets/employer/shortlist_bar.dart';
import '../widgets/map_list_view.dart';
import '../widgets/theme_toggle.dart';

/// Employer-side candidate search — 2026-07 rewrite. Mirrors the candidate
/// browse-jobs UX and layers Phase B interactivity on top: skill-match
/// sort, saved searches with new-match notifications, shortlist mode,
/// recently viewed strip, distance-from-my-job filter, and per-card
/// activity signals.
class EmployerCandidatesPage extends ConsumerStatefulWidget {
  const EmployerCandidatesPage({super.key});
  @override
  ConsumerState<EmployerCandidatesPage> createState() => _EmployerCandidatesPageState();
}

class _EmployerCandidatesPageState extends ConsumerState<EmployerCandidatesPage> {
  final _search = TextEditingController();
  CandidateFilterState _filters = const CandidateFilterState();
  Key _listKey = UniqueKey();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  List<(User, CandidateProfile)> _pool() {
    final allUsers = ref.watch(authProvider.notifier).allUsers();
    final profiles = ref.watch(profileProvider);
    return allUsers
        .where((u) => u.role == Role.candidate)
        .map((u) => (u, profiles[u.id]))
        .where((t) => t.$2 != null && t.$2!.selectedTemplateId != null)
        .map((t) => (t.$1, t.$2!))
        .toList();
  }

  /// Applications submitted in the last 7 days per candidate — powers the
  /// "Active this week" pill on cards.
  Map<String, int> _weeklyApplicationCount() {
    final now = DateTime.now();
    final apps = ref.watch(applicationsProvider).applications;
    final out = <String, int>{};
    for (final a in apps) {
      final t = DateTime.tryParse(a.appliedAt);
      if (t == null) continue;
      if (now.difference(t).inDays > 7) continue;
      out[a.userId] = (out[a.userId] ?? 0) + 1;
    }
    return out;
  }

  List<(User, CandidateProfile)> _filtered(List<(User, CandidateProfile)> pool) {
    final locations = ref.read(locationsProvider);
    final activeJobs = _activeJobsForEmployer();
    final nearJob = _filters.nearJobId != null
        ? activeJobs.where((j) => j.id == _filters.nearJobId).firstOrNull
        : null;

    var results = pool.where((c) {
      if (!_filters.matches(c.$2, locations: locations, nearJob: nearJob)) return false;
      final q = _search.text.trim().toLowerCase();
      if (q.isEmpty) return true;
      final user = c.$1;
      final p = c.$2;
      final hay = [
        user.name,
        p.preferredLocation ?? '',
        p.itSpecialization ?? '',
        ...(p.itLanguages ?? const []),
        ...(p.nonItDepartments ?? const []),
        ...(p.topSkills ?? const []),
        ...(p.experiences ?? const []).map((e) => '${e.company} ${e.role}'),
      ].join(' ').toLowerCase();
      return hay.contains(q);
    }).toList();

    // Sort per state.sort. Skill-match uses the filter's own scoring; a tie
    // falls back to updatedAt so results stay stable rather than jittering.
    switch (_filters.sort) {
      case CandidateSort.skillMatch:
        results.sort((a, b) {
          final sa = _filters.skillMatchScore(a.$2);
          final sb = _filters.skillMatchScore(b.$2);
          final cmp = sb.compareTo(sa);
          if (cmp != 0) return cmp;
          return b.$2.updatedAt.compareTo(a.$2.updatedAt);
        });
        break;
      case CandidateSort.recent:
        results.sort((a, b) => b.$2.updatedAt.compareTo(a.$2.updatedAt));
        break;
      case CandidateSort.alphabetical:
        results.sort((a, b) => a.$1.name.toLowerCase().compareTo(b.$1.name.toLowerCase()));
        break;
    }
    return results;
  }

  List<Job> _activeJobsForEmployer() {
    final employer = ref.read(authProvider);
    if (employer == null) return const [];
    return ref
        .read(jobsProvider.notifier)
        .postedBy(employer.id)
        .where((j) => !j.isExpired)
        .toList();
  }

  Future<void> _openFilters(List<(User, CandidateProfile)> pool) async {
    HapticFeedback.selectionClick();
    final activeJobs = _activeJobsForEmployer();
    final result = await showModalBottomSheet<CandidateFilterState>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => CandidateFilterSheet(
        initial: _filters,
        candidates: pool,
        activeJobs: activeJobs,
        onSave: (state) => _promptSaveSearch(state, pool),
      ),
    );
    if (result != null) setState(() => _filters = result);
  }

  Future<void> _promptSaveSearch(CandidateFilterState state, List<(User, CandidateProfile)> pool) async {
    final employer = ref.read(authProvider);
    if (employer == null) return;
    final controller = TextEditingController();
    bool notify = true;
    final saved = await showDialog<bool>(
      context: context,
      builder: (_) => StatefulBuilder(
        builder: (context, setLocal) => AlertDialog(
          title: const Text('Save this search'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: controller,
                autofocus: true,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(
                  labelText: 'Name',
                  hintText: 'e.g. Chennai React devs 2+ yrs',
                ),
              ),
              const SizedBox(height: 12),
              SwitchListTile.adaptive(
                value: notify,
                onChanged: (v) => setLocal(() => notify = v),
                contentPadding: EdgeInsets.zero,
                title: const Text('Notify me on new matches', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                subtitle: const Text('Adds an entry in your notification bell when a fresh candidate hits these filters.', style: TextStyle(fontSize: 11)),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF97316), foregroundColor: Colors.white),
              child: const Text('Save'),
            ),
          ],
        ),
      ),
    );
    if (saved != true) return;
    final name = controller.text.trim();
    if (name.isEmpty) return;
    // Seed the "known" set with everyone currently matching so the bell
    // only fires for candidates who arrive AFTER the save moment.
    final locations = ref.read(locationsProvider);
    final activeJobs = _activeJobsForEmployer();
    final nearJob = state.nearJobId != null ? activeJobs.where((j) => j.id == state.nearJobId).firstOrNull : null;
    final currentMatchIds = pool
        .where((c) => state.matches(c.$2, locations: locations, nearJob: nearJob))
        .map((c) => c.$1.id)
        .toList();
    ref.read(savedSearchesProvider.notifier).add(
          employerId: employer.id,
          name: name,
          filters: state,
          notify: notify,
          initialCandidateIds: currentMatchIds,
        );
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(children: [
            const Icon(Icons.bookmark_added_rounded, size: 16, color: Colors.white),
            const SizedBox(width: 8),
            Expanded(child: Text('Saved "$name"', style: const TextStyle(fontSize: 12.5))),
          ]),
          backgroundColor: const Color(0xFFEA580C),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          margin: const EdgeInsets.all(16),
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  Future<void> _pullToRefresh() async {
    HapticFeedback.mediumImpact();
    await Future.delayed(const Duration(milliseconds: 600));
    if (mounted) setState(() => _listKey = UniqueKey());
  }

  @override
  Widget build(BuildContext context) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final employer = ref.watch(authProvider)!;
    final subNotifier = ref.watch(subscriptionsProvider.notifier);
    final sub = subNotifier.activeFor(employer.id, SubscriberType.employerSme) ??
        subNotifier.activeFor(employer.id, SubscriberType.employerLarge);
    final hasSub = sub != null;

    final pool = _pool();
    final candidates = _filtered(pool);
    final weeklyApps = _weeklyApplicationCount();
    final shortlistIds = ref.watch(shortlistProvider)[employer.id] ?? const <String>[];

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF18181B) : Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_back_rounded), onPressed: () => context.go('/employer/dashboard')),
        title: const Text('Search candidates', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
        actions: const [ThemeToggle(), SizedBox(width: 12)],
      ),
      body: Stack(
        children: [
          RefreshIndicator(
            onRefresh: _pullToRefresh,
            color: const Color(0xFF0EA5E9),
            child: CustomScrollView(
              slivers: [
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'SEARCH CANDIDATES',
                          style: TextStyle(fontSize: 11, letterSpacing: 2, fontWeight: FontWeight.w800, color: Color(0xFF0369A1)),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          '${candidates.length} candidate${candidates.length == 1 ? "" : "s"} match',
                          style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, letterSpacing: -0.4, color: isDark ? Colors.white : const Color(0xFF09090B)),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          _filters.sort == CandidateSort.skillMatch && _filters.skills.isNotEmpty
                              ? 'Sorted by skill-match against ${_filters.skills.length} required skill${_filters.skills.length == 1 ? "" : "s"}'
                              : hasSub
                                  ? 'Tap any card to view their full CV.'
                                  : 'Subscribe to unlock full CVs.',
                          style: TextStyle(fontSize: 12.5, color: isDark ? Colors.white.withValues(alpha: 0.6) : const Color(0xFF52525B)),
                        ),
                        if (!hasSub) ...[
                          const SizedBox(height: 12),
                          _SubscribeBanner(onTap: () => context.go('/employer/subscribe')),
                        ],
                        const SizedBox(height: 14),
                        const RecentlyViewedStrip(),
                        SavedSearchStrip(
                          onApply: (filters) => setState(() => _filters = filters),
                        ),
                        _SearchBar(controller: _search, onChanged: (_) => setState(() {}), isDark: isDark),
                        const SizedBox(height: 10),
                        _FilterRow(
                          filters: _filters,
                          onOpen: () => _openFilters(pool),
                          onClearFacet: (next) => setState(() => _filters = next),
                          locations: ref.watch(locationsProvider),
                          isDark: isDark,
                        ),
                      ],
                    ),
                  ),
                ),
                if (candidates.isEmpty)
                  SliverToBoxAdapter(child: _EmptyState(isDark: isDark))
                else
                  SliverPadding(
                    key: _listKey,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    sliver: SliverList.builder(
                      itemCount: candidates.length,
                      itemBuilder: (context, i) {
                        final (user, profile) = candidates[i];
                        final shortlisted = shortlistIds.contains(user.id);
                        final matchScore = _filters.skills.isEmpty ? null : _filters.skillMatchScore(profile);
                        final weekApps = weeklyApps[user.id] ?? 0;
                        return _StaggeredEntry(
                          index: i,
                          child: Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: _CandidateCard(
                              user: user,
                              profile: profile,
                              hasSub: hasSub,
                              isDark: isDark,
                              shortlisted: shortlisted,
                              matchScore: matchScore,
                              weeklyApps: weekApps,
                              onTap: () {
                                HapticFeedback.selectionClick();
                                context.go('/employer/candidates/${user.id}');
                              },
                              onLongPress: () {
                                HapticFeedback.mediumImpact();
                                ref.read(shortlistProvider.notifier).toggle(employer.id, user.id);
                              },
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                if (candidates.isNotEmpty)
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      child: MapListView(
                        isDark: isDark,
                        markerTone: MarkerTone.sky,
                        initialMode: MapListMode.map,
                        items: candidates.map((tuple) {
                          final user = tuple.$1;
                          final profile = tuple.$2;
                          double? lat = profile.currentLat;
                          double? lng = profile.currentLng;
                          if (lat == null && profile.preferredDistrictIds.isNotEmpty) {
                            final loc = ref.read(locationsProvider);
                            final d = loc.districtById(profile.preferredDistrictIds.first);
                            if (d != null) {
                              lat = d.lat;
                              lng = d.lng;
                            }
                          }
                          return MapListItem(
                            id: user.id,
                            lat: lat,
                            lng: lng,
                            listBuilder: (_) => const SizedBox.shrink(),
                            popupBuilder: (ctx) => _CandidatePopup(
                              user: user,
                              profile: profile,
                              hasSub: hasSub,
                              isDark: isDark,
                              onTap: () {
                                Navigator.of(ctx).pop();
                                context.go('/employer/candidates/${user.id}');
                              },
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ),
                // Extra bottom padding when the shortlist bar is visible so
                // the last card isn't obscured.
                SliverToBoxAdapter(child: SizedBox(height: (shortlistIds.isEmpty ? 24 : 80) + MediaQuery.of(context).padding.bottom)),
              ],
            ),
          ),
          const Positioned(left: 0, right: 0, bottom: 0, child: ShortlistBar()),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Search bar + filter row (parity with browse jobs)
// ---------------------------------------------------------------------------

class _SearchBar extends StatelessWidget {
  const _SearchBar({required this.controller, required this.onChanged, required this.isDark});
  final TextEditingController controller;
  final ValueChanged<String> onChanged;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      onChanged: onChanged,
      style: TextStyle(fontSize: 13.5, color: isDark ? Colors.white : const Color(0xFF09090B)),
      decoration: InputDecoration(
        hintText: 'Search name, skill, company...',
        hintStyle: TextStyle(fontSize: 12.5, color: isDark ? Colors.white.withValues(alpha: 0.3) : const Color(0xFFA1A1AA)),
        prefixIcon: Icon(Icons.search_rounded, size: 18, color: isDark ? Colors.white.withValues(alpha: 0.5) : const Color(0xFFA1A1AA)),
        suffixIcon: controller.text.isEmpty
            ? null
            : IconButton(
                icon: Icon(Icons.close_rounded, size: 16, color: isDark ? Colors.white.withValues(alpha: 0.5) : const Color(0xFFA1A1AA)),
                onPressed: () {
                  controller.clear();
                  onChanged('');
                },
              ),
        isDense: true,
        filled: true,
        fillColor: isDark ? const Color(0xFF18181B) : Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: isDark ? Colors.white.withValues(alpha: 0.10) : const Color(0xFFE4E4E7)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: isDark ? Colors.white.withValues(alpha: 0.10) : const Color(0xFFE4E4E7)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Color(0xFF0EA5E9), width: 1.5),
        ),
      ),
    );
  }
}

class _FilterRow extends StatelessWidget {
  const _FilterRow({
    required this.filters,
    required this.onOpen,
    required this.onClearFacet,
    required this.locations,
    required this.isDark,
  });
  final CandidateFilterState filters;
  final VoidCallback onOpen;
  final ValueChanged<CandidateFilterState> onClearFacet;
  final LocationsData locations;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 40,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: EdgeInsets.zero,
        children: [
          _FilterButton(onTap: onOpen, active: !filters.isDefault, count: filters.activeCount, isDark: isDark),
          const SizedBox(width: 8),
          if (filters.nearJobId != null) ...[
            _ActiveChip(
              label: 'Within ${(filters.maxDistanceKm ?? 25).toInt()} km',
              onRemove: () => onClearFacet(filters.copyWith(nearJobId: () => null, maxDistanceKm: () => null)),
            ),
            const SizedBox(width: 6),
          ],
          for (final id in filters.districtIds) ...[
            _ActiveChip(
              label: locations.districtById(id)?.name ?? id,
              onRemove: () => onClearFacet(filters.copyWith(districtIds: filters.districtIds.where((x) => x != id).toList())),
            ),
            const SizedBox(width: 6),
          ],
          if (filters.field != null) ...[
            _ActiveChip(
              label: filters.field == JobField.it ? 'IT' : 'Non-IT',
              onRemove: () => onClearFacet(filters.copyWith(field: () => null)),
            ),
            const SizedBox(width: 6),
          ],
          if (filters.candidateType != null) ...[
            _ActiveChip(
              label: filters.candidateType == CandidateType.fresher ? 'Fresher' : 'Experienced',
              onRemove: () => onClearFacet(filters.copyWith(candidateType: () => null)),
            ),
            const SizedBox(width: 6),
          ],
          if (filters.yearsMin != null || filters.yearsMax != null) ...[
            _ActiveChip(
              label: '${filters.yearsMin ?? 0}–${filters.yearsMax ?? 30} yrs',
              onRemove: () => onClearFacet(filters.copyWith(yearsMin: () => null, yearsMax: () => null)),
            ),
            const SizedBox(width: 6),
          ],
          for (final level in filters.educationLevels) ...[
            _ActiveChip(
              label: educationLevelKey(level).toUpperCase(),
              onRemove: () => onClearFacet(filters.copyWith(educationLevels: filters.educationLevels.where((x) => x != level).toList())),
            ),
            const SizedBox(width: 6),
          ],
          for (final s in filters.skills) ...[
            _ActiveChip(
              label: s,
              onRemove: () => onClearFacet(filters.copyWith(skills: filters.skills.where((x) => x != s).toList())),
            ),
            const SizedBox(width: 6),
          ],
        ],
      ),
    );
  }
}

class _FilterButton extends StatelessWidget {
  const _FilterButton({required this.onTap, required this.active, required this.count, required this.isDark});
  final VoidCallback onTap;
  final bool active;
  final int count;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            gradient: active ? const LinearGradient(colors: [Color(0xFF0EA5E9), Color(0xFF0369A1)]) : null,
            color: active ? null : (isDark ? const Color(0xFF18181B) : Colors.white),
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: active ? Colors.transparent : (isDark ? Colors.white.withValues(alpha: 0.10) : const Color(0xFFE4E4E7))),
            boxShadow: active ? [BoxShadow(color: const Color(0xFF0EA5E9).withValues(alpha: 0.35), blurRadius: 10, offset: const Offset(0, 4))] : null,
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Icon(Icons.tune_rounded, size: 15, color: active ? Colors.white : (isDark ? Colors.white.withValues(alpha: 0.75) : const Color(0xFF52525B))),
            const SizedBox(width: 6),
            Text(active ? 'Filters' : 'Filter', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: active ? Colors.white : (isDark ? Colors.white.withValues(alpha: 0.85) : const Color(0xFF3F3F46)))),
            if (active) ...[
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.30), borderRadius: BorderRadius.circular(999)),
                child: Text('$count', style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w800, color: Colors.white)),
              ),
            ],
          ]),
        ),
      ),
    );
  }
}

class _ActiveChip extends StatelessWidget {
  const _ActiveChip({required this.label, required this.onRemove});
  final String label;
  final VoidCallback onRemove;
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.only(left: 10, right: 4, top: 4, bottom: 4),
      decoration: BoxDecoration(
        color: const Color(0xFF0EA5E9).withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: const Color(0xFF0EA5E9).withValues(alpha: 0.25)),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF0369A1))),
        InkWell(
          onTap: () {
            HapticFeedback.selectionClick();
            onRemove();
          },
          borderRadius: BorderRadius.circular(999),
          child: const Padding(
            padding: EdgeInsets.all(4),
            child: Icon(Icons.close_rounded, size: 11, color: Color(0xFF0369A1)),
          ),
        ),
      ]),
    );
  }
}

// ---------------------------------------------------------------------------
// Non-subscriber upsell banner
// ---------------------------------------------------------------------------

class _SubscribeBanner extends StatelessWidget {
  const _SubscribeBanner({required this.onTap});
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        gradient: const LinearGradient(colors: [Color(0xFFFEF3C7), Color(0xFFFFEDD5)]),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.4)),
      ),
      child: Row(
        children: [
          const Icon(Icons.shield_outlined, size: 18, color: Color(0xFFB45309)),
          const SizedBox(width: 8),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("You're browsing without an active subscription", style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Color(0xFFB45309))),
                Text('Preview cards. Subscribe to view full profiles.', style: TextStyle(fontSize: 11, color: Color(0xFFB45309))),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: onTap,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0EA5E9),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
              elevation: 0,
            ),
            child: const Text('Plans', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800)),
          ),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Staggered card fade-in (mirrors browse jobs)
// ---------------------------------------------------------------------------

class _StaggeredEntry extends StatelessWidget {
  const _StaggeredEntry({required this.index, required this.child});
  final int index;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final delay = Duration(milliseconds: (index.clamp(0, 10) * 55));
    return TweenAnimationBuilder<double>(
      key: ValueKey(child.key ?? index),
      tween: Tween(begin: 0, end: 1),
      duration: const Duration(milliseconds: 400) + delay,
      curve: Curves.easeOutCubic,
      builder: (_, t, ch) => Opacity(
        opacity: t,
        child: Transform.translate(offset: Offset(0, (1 - t) * 12), child: ch),
      ),
      child: child,
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.isDark});
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(shape: BoxShape.circle, color: const Color(0xFF0EA5E9).withValues(alpha: 0.10)),
            child: const Icon(Icons.person_search_rounded, size: 32, color: Color(0xFF0369A1)),
          ),
          const SizedBox(height: 12),
          Text('No candidates match your filters', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: isDark ? Colors.white : const Color(0xFF09090B))),
          const SizedBox(height: 4),
          Text('Try loosening a filter or pulling down to refresh.', textAlign: TextAlign.center, style: TextStyle(fontSize: 12, color: isDark ? Colors.white.withValues(alpha: 0.55) : const Color(0xFF71717A))),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Candidate card — now with shortlist state, match % badge, activity pill
// ---------------------------------------------------------------------------

class _CandidateCard extends StatelessWidget {
  const _CandidateCard({
    required this.user,
    required this.profile,
    required this.hasSub,
    required this.isDark,
    required this.shortlisted,
    required this.matchScore,
    required this.weeklyApps,
    required this.onTap,
    required this.onLongPress,
  });
  final User user;
  final CandidateProfile profile;
  final bool hasSub;
  final bool isDark;
  final bool shortlisted;

  /// null when no skills are being filtered on. 0.0 – 1.0 otherwise.
  final double? matchScore;
  final int weeklyApps;
  final VoidCallback onTap;
  final VoidCallback onLongPress;

  @override
  Widget build(BuildContext context) {
    final initials = user.name.split(RegExp(r'\s+')).take(2).map((p) => p.isEmpty ? '' : p[0].toUpperCase()).join();
    final skills = profile.type == CandidateType.experienced
        ? profile.topSkills ?? []
        : profile.field == FieldKind.it
            ? profile.itLanguages ?? []
            : profile.nonItDepartments ?? [];
    final role = profile.type == CandidateType.experienced
        ? '${profile.yearsOfExperience ?? "—"} years experience'
        : profile.field == FieldKind.it
            ? 'Aspiring ${profile.itSpecialization ?? "IT"}'
            : profile.field == FieldKind.nonIt
                ? 'Aspiring ${profile.nonItDepartments?.firstOrNull ?? "Non-IT"}'
                : 'Candidate';

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        onLongPress: onLongPress,
        borderRadius: BorderRadius.circular(20),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: shortlisted
                ? const Color(0xFF7C3AED).withValues(alpha: 0.06)
                : (isDark ? const Color(0xFF18181B) : Colors.white),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: shortlisted
                  ? const Color(0xFF7C3AED)
                  : (isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE4E4E7)),
              width: shortlisted ? 1.5 : 1,
            ),
            boxShadow: [
              BoxShadow(
                color: shortlisted
                    ? const Color(0xFF7C3AED).withValues(alpha: 0.15)
                    : Colors.black.withValues(alpha: 0.03),
                blurRadius: shortlisted ? 14 : 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Stack(
                    clipBehavior: Clip.none,
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(14),
                          gradient: const LinearGradient(colors: [Color(0xFF0EA5E9), Color(0xFF0369A1)]),
                          boxShadow: [BoxShadow(color: const Color(0xFF0EA5E9).withValues(alpha: 0.30), blurRadius: 8, offset: const Offset(0, 4))],
                        ),
                        child: Center(child: Text(initials, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 14))),
                      ),
                      if (shortlisted)
                        Positioned(
                          top: -4,
                          right: -4,
                          child: Container(
                            width: 20,
                            height: 20,
                            decoration: BoxDecoration(
                              color: const Color(0xFF7C3AED),
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 1.5),
                              boxShadow: [BoxShadow(color: const Color(0xFF7C3AED).withValues(alpha: 0.5), blurRadius: 4, offset: const Offset(0, 2))],
                            ),
                            child: const Icon(Icons.bookmark_rounded, size: 11, color: Colors.white),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(hasSub ? user.name : '•••••• ••••••', maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: isDark ? Colors.white : const Color(0xFF09090B))),
                            ),
                            if (matchScore != null) _MatchBadge(score: matchScore!),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Text(role, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 11.5, color: isDark ? Colors.white.withValues(alpha: 0.6) : const Color(0xFF52525B))),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Wrap(
                spacing: 5,
                runSpacing: 5,
                children: [
                  if (profile.preferredLocation != null)
                    _pill(Icons.place_rounded, profile.preferredLocation!, const Color(0xFF71717A), isDark),
                  if (profile.field == FieldKind.it) _pill(Icons.code_rounded, 'IT', const Color(0xFF0284C7), isDark),
                  if (profile.field == FieldKind.nonIt) _pill(Icons.business_center_rounded, 'Non-IT', const Color(0xFFD97706), isDark),
                  if (profile.type == CandidateType.fresher) _pill(Icons.auto_awesome_rounded, 'Fresher', const Color(0xFF059669), isDark),
                  if (profile.type == CandidateType.experienced) _pill(Icons.work_rounded, '${profile.yearsOfExperience ?? "—"} yrs', const Color(0xFF7C3AED), isDark),
                  if (weeklyApps >= 3)
                    _pill(Icons.local_fire_department_rounded, 'Active · $weeklyApps this week', const Color(0xFFE11D48), isDark)
                  else if (weeklyApps > 0)
                    _pill(Icons.trending_up_rounded, 'Applied recently', const Color(0xFF10B981), isDark),
                ],
              ),
              if (skills.isNotEmpty) ...[
                const SizedBox(height: 8),
                Wrap(
                  spacing: 4,
                  runSpacing: 4,
                  children: skills.take(5).map((s) => Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(color: isDark ? Colors.white.withValues(alpha: 0.06) : const Color(0xFFF4F4F5), borderRadius: BorderRadius.circular(999)),
                    child: Text(s, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: isDark ? Colors.white.withValues(alpha: 0.8) : const Color(0xFF52525B))),
                  )).toList(),
                ),
              ],
              if (!hasSub) ...[
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEF3C7),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.4)),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.lock_rounded, size: 11, color: Color(0xFFB45309)),
                      SizedBox(width: 5),
                      Text('Full profile locked — subscribe to view', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: Color(0xFFB45309))),
                    ],
                  ),
                ),
              ],
              if (shortlisted) ...[
                const SizedBox(height: 8),
                const Text(
                  'Long-press again to remove from shortlist',
                  style: TextStyle(fontSize: 10, color: Color(0xFF7C3AED), fontWeight: FontWeight.w700),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _pill(IconData icon, String text, Color color, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: color.withValues(alpha: isDark ? 0.18 : 0.10), borderRadius: BorderRadius.circular(999)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 10, color: color),
          const SizedBox(width: 4),
          Text(text, style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w700, color: color)),
        ],
      ),
    );
  }
}

/// Match-% badge next to the candidate name. Colour tiers so employers can
/// scan the list without reading numbers:
///  * ≥ 80 % → emerald "great fit"
///  * ≥ 50 % → amber "worth a look"
///  * otherwise → zinc "some overlap"
class _MatchBadge extends StatelessWidget {
  const _MatchBadge({required this.score});
  final double score;

  @override
  Widget build(BuildContext context) {
    final pct = (score * 100).round();
    Color tone;
    if (pct >= 80) {
      tone = const Color(0xFF10B981);
    } else if (pct >= 50) {
      tone = const Color(0xFFF59E0B);
    } else {
      tone = const Color(0xFF71717A);
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [tone, tone.withValues(alpha: 0.85)]),
        borderRadius: BorderRadius.circular(999),
        boxShadow: [BoxShadow(color: tone.withValues(alpha: 0.35), blurRadius: 6, offset: const Offset(0, 2))],
      ),
      child: Text('$pct%', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.white)),
    );
  }
}

class _CandidatePopup extends StatelessWidget {
  const _CandidatePopup({
    required this.user,
    required this.profile,
    required this.hasSub,
    required this.isDark,
    required this.onTap,
  });
  final User user;
  final CandidateProfile profile;
  final bool hasSub;
  final bool isDark;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final initials = user.name.split(RegExp(r'\s+')).take(2).map((p) => p.isEmpty ? '' : p[0].toUpperCase()).join();
    final role = profile.type == CandidateType.experienced
        ? '${profile.yearsOfExperience ?? "—"} yrs experience'
        : profile.field == FieldKind.it
            ? 'Aspiring ${profile.itSpecialization ?? "IT"}'
            : profile.field == FieldKind.nonIt
                ? 'Aspiring ${profile.nonItDepartments?.firstOrNull ?? "Non-IT"}'
                : 'Candidate';

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Container(
                  width: 40, height: 40,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    gradient: const LinearGradient(colors: [Color(0xFF0EA5E9), Color(0xFF0369A1)]),
                  ),
                  child: Center(child: Text(initials.isEmpty ? '—' : initials, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 13))),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(hasSub ? user.name : '•••••• ••••••', maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: isDark ? Colors.white : const Color(0xFF09090B))),
                      Text(role, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 11.5, color: isDark ? Colors.white.withValues(alpha: 0.6) : const Color(0xFF52525B))),
                    ],
                  ),
                ),
              ],
            ),
            if (profile.preferredLocation != null) ...[
              const SizedBox(height: 8),
              Row(
                children: [
                  const Icon(Icons.place_rounded, size: 12, color: Color(0xFF71717A)),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(profile.preferredLocation!, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 11.5, color: isDark ? Colors.white.withValues(alpha: 0.7) : const Color(0xFF52525B))),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 8),
            Row(
              children: [
                if (!hasSub)
                  const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.lock_rounded, size: 11, color: Color(0xFFB45309)),
                      SizedBox(width: 4),
                      Text('Subscribe to view', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: Color(0xFFB45309))),
                    ],
                  ),
                const Spacer(),
                const Text('View →', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF0EA5E9))),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
