import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../store/auth_provider.dart';
import '../store/jobs_provider.dart';
import '../store/profile_provider.dart';
import '../store/theme_provider.dart';
import '../utils/skill_synonyms.dart';
import '../widgets/job_filter_sheet.dart';
import '../widgets/map_list_view.dart';
import '../widgets/save_job_button.dart';
import '../widgets/theme_toggle.dart';

/// Candidate-facing job browse. The 2026-06 refactor swaps the inline
/// dropdown filters for a full-screen filter sheet, adds pull-to-refresh,
/// hides expired jobs by default (respecting the new 45-day validity), and
/// animates each card in with a staggered fade so the list feels alive
/// instead of dumping 30 tiles at once.
class JobBrowsePage extends ConsumerStatefulWidget {
  const JobBrowsePage({super.key});

  @override
  ConsumerState<JobBrowsePage> createState() => _JobBrowsePageState();
}

class _JobBrowsePageState extends ConsumerState<JobBrowsePage> {
  final _search = TextEditingController();
  JobFilterState _filters = const JobFilterState();
  Key _listKey = UniqueKey();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  /// Rank + partition — mirror of web's JobBrowse.
  ///
  /// `_filters.matches` narrows the pool strictly. Inside the pool the
  /// candidate's profile (top skills, preferred districts) plus any typed
  /// search text act as soft signals — jobs that hit either float to the
  /// top of a capped "Best matches" strip. The full sorted pool always
  /// renders in `others` regardless, so the "All jobs" section shows
  /// everything (matches are a subset — repeated by design).
  _RankedJobs _ranked(List<Job> jobs, CandidateProfile? profile) {
    final pool = jobs.where((j) => _filters.matches(j)).toList();
    final q = _search.text.trim().toLowerCase();

    // Sort the pool once — newest first when no profile, best-scored when
    // we have one. Same shape as web's `sortAll` fallback.
    pool.sort((a, b) => b.postedAt.compareTo(a.postedAt));

    final hasSignal = q.isNotEmpty || profile != null;
    if (!hasSignal) {
      return _RankedJobs(matched: const [], others: pool, hasSignal: false);
    }

    final profileSkills = <String>[
      ...(profile?.topSkills ?? const []),
      ...(profile?.itLanguages ?? const []),
      ...(profile?.nonItDepartments ?? const []),
    ];
    final profileDistricts = <String>{
      ...(profile?.preferredDistrictIds ?? const []),
      if (profile?.currentDistrictId != null) profile!.currentDistrictId!,
    };

    double score(Job j) {
      double s = 0;
      if (q.isNotEmpty) {
        final hay = '${j.title} ${j.employerName} ${j.description} ${j.skills.join(" ")}'.toLowerCase();
        if (hay.contains(q)) s += 3;
      }
      if (profileSkills.isNotEmpty && j.skills.isNotEmpty) {
        // Word-boundary + synonym match from utils/skill_synonyms.dart —
        // same algorithm the web side uses (skillSynonyms.ts). No more
        // false positive where a JavaScript candidate would match a Java
        // job just because "java" is a substring of "javascript".
        int hits = 0;
        for (final needed in j.skills) {
          if (candidateHasSkill(profileSkills, needed)) hits++;
        }
        s += (hits / j.skills.length) * 4;
      }
      if (profileDistricts.isNotEmpty && j.districtId != null && profileDistricts.contains(j.districtId)) {
        s += 2;
      }
      return s;
    }

    final scored = pool.map((j) => (j, score(j))).toList()
      ..sort((a, b) {
        final c = b.$2.compareTo(a.$2);
        return c != 0 ? c : b.$1.postedAt.compareTo(a.$1.postedAt);
      });

    // Skill gate for Best Matches — location + type + posted-window
    // alone aren't enough. The candidate needs at least one skill in
    // common with the job's required skills. Jobs with no required
    // skills listed (internships / generic) bypass the gate.
    bool passesSkillGate(Job j) {
      if (j.skills.isEmpty) return true;
      if (profileSkills.isEmpty) return false;
      for (final needed in j.skills) {
        if (candidateHasSkill(profileSkills, needed)) return true;
      }
      // Search hit as escape hatch — user intent overrides the gate.
      if (q.isNotEmpty) {
        final hay = '${j.title} ${j.employerName} ${j.description} ${j.skills.join(" ")}'.toLowerCase();
        if (hay.contains(q)) return true;
      }
      return false;
    }

    const featuredCap = 5;
    final positive = scored
        .where((t) => t.$2 > 0 && passesSkillGate(t.$1))
        .toList();

    // Fall back to top-N only when the profile has zero skills declared —
    // otherwise an empty featured strip is the correct answer (no jobs
    // truly match the candidate's skills).
    final profileHasSkills = profileSkills.isNotEmpty;
    final featured = positive.isNotEmpty
        ? positive.take(featuredCap).map((t) => t.$1).toList()
        : profileHasSkills
            ? <Job>[]
            : scored.take(featuredCap).map((t) => t.$1).toList();

    return _RankedJobs(matched: featured, others: scored.map((t) => t.$1).toList(), hasSignal: true);
  }

  Future<void> _openFilters() async {
    HapticFeedback.selectionClick();
    final result = await showModalBottomSheet<JobFilterState>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => JobFilterSheet(initial: _filters, jobs: ref.read(jobsProvider)),
    );
    if (result != null) setState(() => _filters = result);
  }

  Future<void> _pullToRefresh() async {
    HapticFeedback.mediumImpact();
    // Simulate a network refresh — nothing to reload since the store is
    // local, but the animation confirms the gesture registered and the
    // key bump triggers the staggered entrance again for a satisfying beat.
    await Future.delayed(const Duration(milliseconds: 700));
    if (mounted) setState(() => _listKey = UniqueKey());
  }

  @override
  Widget build(BuildContext context) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final jobs = ref.watch(jobsProvider);
    final user = ref.watch(authProvider);
    final profiles = ref.watch(profileProvider);
    final profile = user != null ? profiles[user.id] : null;
    final ranked = _ranked(jobs, profile);
    // `others` is the full sorted pool (matches are a subset). No concat.
    final total = ranked.others.length;
    final all = ranked.others;
    final showFeatured = ranked.hasSignal && ranked.matched.isNotEmpty;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF18181B) : Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.go('/candidate/dashboard'),
        ),
        title: const Text('Browse Jobs', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
        actions: const [ThemeToggle(), SizedBox(width: 12)],
      ),
      body: RefreshIndicator(
        onRefresh: _pullToRefresh,
        color: const Color(0xFFF97316),
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'OPENINGS ACROSS TAMIL NADU',
                      style: TextStyle(fontSize: 11, letterSpacing: 2, fontWeight: FontWeight.w800, color: Color(0xFFEA580C)),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.baseline,
                      textBaseline: TextBaseline.alphabetic,
                      children: [
                        Text(
                          '$total ${total == 1 ? "job" : "jobs"} in view',
                          style: TextStyle(fontSize: 13, color: isDark ? Colors.white.withValues(alpha: 0.6) : const Color(0xFF52525B)),
                        ),
                        if (ranked.hasSignal && ranked.matched.isNotEmpty) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: const Color(0xFF10B981).withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(
                              '${ranked.matched.length} match',
                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF047857)),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 14),
                    _SearchBar(controller: _search, onChanged: (_) => setState(() {}), isDark: isDark),
                    const SizedBox(height: 10),
                    _FilterRow(
                      filters: _filters,
                      onOpen: _openFilters,
                      onClearFacet: (next) => setState(() => _filters = next),
                      isDark: isDark,
                    ),
                  ],
                ),
              ),
            ),
            if (total == 0)
              SliverToBoxAdapter(child: _EmptyState(isDark: isDark))
            else
              SliverPadding(
                key: _listKey,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverList.builder(
                  itemCount: showFeatured
                      ? total + ranked.matched.length + 2
                      : total,
                  itemBuilder: (context, i) {
                    Widget jobRow(int index, Job job) => _StaggeredEntry(
                          index: index,
                          child: Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: _JobCard(
                              job: job,
                              isDark: isDark,
                              onTap: () {
                                HapticFeedback.selectionClick();
                                context.go('/candidate/jobs/${job.id}');
                              },
                            ),
                          ),
                        );

                    if (showFeatured) {
                      if (i == 0) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _JobSectionSeparator(
                            label: 'Best matches',
                            count: ranked.matched.length,
                            isDark: isDark,
                            accent: const Color(0xFFEA580C),
                          ),
                        );
                      }
                      if (i >= 1 && i <= ranked.matched.length) {
                        final idx = i - 1;
                        return jobRow(idx, ranked.matched[idx]);
                      }
                      if (i == ranked.matched.length + 1) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: _JobSectionSeparator(
                            label: 'All jobs',
                            count: total,
                            isDark: isDark,
                          ),
                        );
                      }
                      final idx = i - (ranked.matched.length + 2);
                      return jobRow(idx, all[idx]);
                    }
                    return jobRow(i, all[i]);
                  },
                ),
              ),
            if (total > 0)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: MapListView(
                    isDark: isDark,
                    markerTone: MarkerTone.brand,
                    // Default the toggle to the map — the list version is
                    // already rendered above; this widget is here purely so
                    // candidates can spot jobs on the map at a glance.
                    initialMode: MapListMode.map,
                    items: all
                        .map((job) => MapListItem(
                              id: job.id,
                              lat: job.lat,
                              lng: job.lng,
                              listBuilder: (_) => const SizedBox.shrink(),
                              popupBuilder: (ctx) => _JobPopup(
                                job: job,
                                isDark: isDark,
                                onTap: () {
                                  Navigator.of(ctx).pop();
                                  context.go('/candidate/jobs/${job.id}');
                                },
                              ),
                            ))
                        .toList(),
                  ),
                ),
              ),
            SliverToBoxAdapter(child: SizedBox(height: 24 + MediaQuery.of(context).padding.bottom)),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Search bar + filter chips row
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
        hintText: 'Search role, company, skill...',
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
          borderSide: const BorderSide(color: Color(0xFFF97316), width: 1.5),
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
    required this.isDark,
  });

  final JobFilterState filters;
  final VoidCallback onOpen;
  final ValueChanged<JobFilterState> onClearFacet;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 40,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: EdgeInsets.zero,
        children: [
          _FilterButton(
            onTap: onOpen,
            active: !filters.isDefault,
            count: filters.activeCount,
            isDark: isDark,
          ),
          const SizedBox(width: 8),
          if (filters.field != null) ...[
            _ActiveChip(
              label: filters.field == JobField.it ? 'IT' : 'Non-IT',
              onRemove: () => onClearFacet(filters.copyWith(field: () => null)),
            ),
            const SizedBox(width: 6),
          ],
          for (final t in filters.types) ...[
            _ActiveChip(
              label: typeLabelShort[t]!,
              onRemove: () => onClearFacet(filters.copyWith(types: filters.types.where((x) => x != t).toList())),
            ),
            const SizedBox(width: 6),
          ],
          if (filters.experience != null) ...[
            _ActiveChip(
              label: filters.experience == JobExperience.fresher
                  ? 'Fresher'
                  : filters.experience == JobExperience.experienced
                      ? 'Experienced'
                      : 'Any exp',
              onRemove: () => onClearFacet(filters.copyWith(experience: () => null)),
            ),
            const SizedBox(width: 6),
          ],
          if (filters.postedWithinDays != null) ...[
            _ActiveChip(
              label: filters.postedWithinDays == 1
                  ? 'Last 24h'
                  : filters.postedWithinDays == 7
                      ? 'This week'
                      : 'This month',
              onRemove: () => onClearFacet(filters.copyWith(postedWithinDays: () => null)),
            ),
            const SizedBox(width: 6),
          ],
          if (filters.industry != null) ...[
            _ActiveChip(
              label: filters.industry!,
              onRemove: () => onClearFacet(filters.copyWith(industry: () => null)),
            ),
            const SizedBox(width: 6),
          ],
          if (filters.department != null) ...[
            _ActiveChip(
              label: filters.department!,
              onRemove: () => onClearFacet(filters.copyWith(department: () => null)),
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
            gradient: active ? const LinearGradient(colors: [Color(0xFFF97316), Color(0xFFEA580C)]) : null,
            color: active ? null : (isDark ? const Color(0xFF18181B) : Colors.white),
            borderRadius: BorderRadius.circular(999),
            border: Border.all(color: active ? Colors.transparent : (isDark ? Colors.white.withValues(alpha: 0.10) : const Color(0xFFE4E4E7))),
            boxShadow: active ? [BoxShadow(color: const Color(0xFFF97316).withValues(alpha: 0.35), blurRadius: 10, offset: const Offset(0, 4))] : null,
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
        color: const Color(0xFFF97316).withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: const Color(0xFFF97316).withValues(alpha: 0.25)),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFFC2410C))),
        InkWell(
          onTap: () {
            HapticFeedback.selectionClick();
            onRemove();
          },
          borderRadius: BorderRadius.circular(999),
          child: const Padding(
            padding: EdgeInsets.all(4),
            child: Icon(Icons.close_rounded, size: 11, color: Color(0xFFC2410C)),
          ),
        ),
      ]),
    );
  }
}

// ---------------------------------------------------------------------------
// Staggered card fade-in
// ---------------------------------------------------------------------------

class _StaggeredEntry extends StatelessWidget {
  const _StaggeredEntry({required this.index, required this.child});
  final int index;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    // Cap the stagger so a list of 50 doesn't crawl in for 3 seconds; after
    // ~10 items new cards fade near-instantly.
    final delay = Duration(milliseconds: (index.clamp(0, 10) * 55));
    return TweenAnimationBuilder<double>(
      key: ValueKey(child.key ?? index),
      tween: Tween(begin: 0, end: 1),
      duration: const Duration(milliseconds: 400) + delay,
      curve: Curves.easeOutCubic,
      builder: (_, t, ch) => Opacity(
        opacity: t,
        child: Transform.translate(
          offset: Offset(0, (1 - t) * 12),
          child: ch,
        ),
      ),
      child: child,
    );
  }
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

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
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFFF97316).withValues(alpha: 0.10),
            ),
            child: const Icon(Icons.search_off_rounded, size: 32, color: Color(0xFFEA580C)),
          ),
          const SizedBox(height: 12),
          Text('No jobs match your filters', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: isDark ? Colors.white : const Color(0xFF09090B))),
          const SizedBox(height: 4),
          Text('Try loosening a filter or pulling down to refresh.', textAlign: TextAlign.center, style: TextStyle(fontSize: 12, color: isDark ? Colors.white.withValues(alpha: 0.55) : const Color(0xFF71717A))),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Job card + map popup
// ---------------------------------------------------------------------------

class _JobCard extends StatelessWidget {
  const _JobCard({required this.job, required this.isDark, required this.onTap});
  final Job job;
  final bool isDark;
  final VoidCallback onTap;

  String get _initials {
    final parts = job.employerName.split(RegExp(r'\s+'));
    return parts.take(2).map((p) => p.isEmpty ? '' : p[0].toUpperCase()).join();
  }

  @override
  Widget build(BuildContext context) {
    final isIt = job.field == JobField.it;
    final freshersWelcome = job.experience == JobExperience.fresher || job.experience == JobExperience.any;
    final tone = typeTone[job.type]!;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF18181B) : Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE4E4E7)),
            boxShadow: [
              BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 12, offset: const Offset(0, 4)),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      gradient: LinearGradient(
                        colors: isIt ? const [Color(0xFF0EA5E9), Color(0xFF0369A1)] : const [Color(0xFFF97316), Color(0xFFC2410C)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: (isIt ? const Color(0xFF0EA5E9) : const Color(0xFFF97316)).withValues(alpha: 0.35),
                          blurRadius: 8,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Center(child: Text(_initials, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 13))),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    // Title + employer name are now inline on one row —
                    // matches the 2026-08 web change that pulled the company
                    // out of a separate line for a denser scan.
                    child: RichText(
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      text: TextSpan(
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: isDark ? Colors.white : const Color(0xFF09090B)),
                        children: [
                          TextSpan(text: job.title),
                          TextSpan(
                            text: '  ·  ${job.employerName}',
                            style: TextStyle(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w600,
                              color: isDark ? Colors.white.withValues(alpha: 0.6) : const Color(0xFF52525B),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  SaveJobButton(jobId: job.id, jobTitle: job.title, size: SaveJobButtonSize.small),
                ],
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  _Pill(text: job.location, icon: Icons.place_rounded, color: const Color(0xFF71717A), isDark: isDark),
                  _Pill(text: fieldLabel[job.field]!, icon: isIt ? Icons.code_rounded : Icons.business_center_rounded, color: isIt ? const Color(0xFF0284C7) : const Color(0xFFD97706), isDark: isDark),
                  _Pill(text: typeLabelShort[job.type]!, icon: typeIcon[job.type]!, color: tone, isDark: isDark),
                  if (freshersWelcome && job.type != JobType.internshipTraining)
                    _Pill(text: 'Freshers welcome', icon: Icons.auto_awesome_rounded, color: const Color(0xFF059669), isDark: isDark),
                  if (job.benefits.isNotEmpty)
                    _Pill(text: '+${job.benefits.length} ${job.benefits.length == 1 ? "benefit" : "benefits"}', icon: Icons.card_giftcard_rounded, color: const Color(0xFF7C3AED), isDark: isDark),
                ],
              ),
              const SizedBox(height: 12),
              Text(job.description, maxLines: 2, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, height: 1.45, color: isDark ? Colors.white.withValues(alpha: 0.6) : const Color(0xFF52525B))),
              const SizedBox(height: 12),
              Row(children: [
                Text(job.salaryRange ?? 'Competitive', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Color(0xFF059669))),
                const Spacer(),
                Icon(Icons.access_time_rounded, size: 11, color: isDark ? Colors.white.withValues(alpha: 0.4) : const Color(0xFFA1A1AA)),
                const SizedBox(width: 4),
                Text(relativeTime(job.postedAt), style: TextStyle(fontSize: 10.5, color: isDark ? Colors.white.withValues(alpha: 0.5) : const Color(0xFF71717A))),
              ]),
            ],
          ),
        ),
      ),
    );
  }
}

class _JobPopup extends StatelessWidget {
  const _JobPopup({required this.job, required this.isDark, required this.onTap});
  final Job job;
  final bool isDark;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final isIt = job.field == JobField.it;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(10),
                  gradient: LinearGradient(colors: isIt ? const [Color(0xFF0EA5E9), Color(0xFF0369A1)] : const [Color(0xFFF97316), Color(0xFFC2410C)]),
                ),
                child: Center(child: Icon(isIt ? Icons.code_rounded : Icons.business_center_rounded, size: 16, color: Colors.white)),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(job.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: isDark ? Colors.white : const Color(0xFF09090B))),
                    Text(job.employerName, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 11.5, color: isDark ? Colors.white.withValues(alpha: 0.6) : const Color(0xFF52525B))),
                  ],
                ),
              ),
            ]),
            const SizedBox(height: 8),
            Wrap(spacing: 6, runSpacing: 6, children: [
              _Pill(text: job.location, icon: Icons.place_rounded, color: const Color(0xFF71717A), isDark: isDark),
              _Pill(text: typeLabelShort[job.type]!, icon: typeIcon[job.type]!, color: typeTone[job.type]!, isDark: isDark),
            ]),
            const SizedBox(height: 6),
            Row(children: [
              Text(job.salaryRange ?? 'Competitive', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Color(0xFF059669))),
              const Spacer(),
              const Text('View →', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFFF97316))),
            ]),
          ],
        ),
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill({required this.text, required this.icon, required this.color, required this.isDark});
  final String text;
  final IconData icon;
  final Color color;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: color.withValues(alpha: isDark ? 0.18 : 0.10), borderRadius: BorderRadius.circular(999)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 10, color: color),
        const SizedBox(width: 4),
        Text(text, style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w700, color: color)),
      ]),
    );
  }
}

/// Split of a filtered job list into "best matches" (search-text hit) and
/// "other jobs" (rest). When `hasSignal` is false, `matched` is empty and
/// everyone lives in `others` — the divider stays hidden.
class _RankedJobs {
  const _RankedJobs({
    required this.matched,
    required this.others,
    required this.hasSignal,
  });
  final List<Job> matched;
  final List<Job> others;
  final bool hasSignal;
}

/// Divider strip rendered between the "matched" and "others" groups in the
/// SliverList. Private per-file so the styling stays consistent with the
/// rest of the browse page.
class _JobSectionSeparator extends StatelessWidget {
  const _JobSectionSeparator({
    required this.label,
    required this.count,
    required this.isDark,
    this.accent,
  });
  final String label;
  final int count;
  final bool isDark;
  /// Brand accent for the "Best matches" strip. Null → neutral zinc.
  final Color? accent;

  @override
  Widget build(BuildContext context) {
    final isAccent = accent != null;
    final chipBg = isAccent
        ? accent!.withValues(alpha: 0.14)
        : (isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFF4F4F5));
    final chipText = isAccent
        ? accent!
        : (isDark ? Colors.white.withValues(alpha: 0.9) : const Color(0xFF3F3F46));
    final pillBg = isAccent ? accent! : const Color(0xFF71717A);
    final line = isDark ? Colors.white.withValues(alpha: 0.10) : const Color(0xFFE4E4E7);
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
          decoration: BoxDecoration(color: chipBg, borderRadius: BorderRadius.circular(999)),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.horizontal_split, size: 12, color: chipText),
              const SizedBox(width: 6),
              Text(
                label.toUpperCase(),
                style: TextStyle(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.4,
                  color: chipText,
                ),
              ),
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: pillBg,
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text('$count', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Colors.white)),
              ),
            ],
          ),
        ),
        const SizedBox(width: 10),
        Expanded(child: Container(height: 1, color: line)),
      ],
    );
  }
}
