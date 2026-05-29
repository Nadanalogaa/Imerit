import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../store/auth_provider.dart';
import '../store/profile_provider.dart';
import '../store/subscriptions_provider.dart';
import '../store/theme_provider.dart';
import '../widgets/theme_toggle.dart';
import '../widgets/map_list_view.dart';

class EmployerCandidatesPage extends ConsumerStatefulWidget {
  const EmployerCandidatesPage({super.key});
  @override
  ConsumerState<EmployerCandidatesPage> createState() => _EmployerCandidatesPageState();
}

class _EmployerCandidatesPageState extends ConsumerState<EmployerCandidatesPage> {
  String _field = 'all';
  String _type = 'all';

  @override
  Widget build(BuildContext context) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final employer = ref.watch(authProvider)!;
    final allUsers = ref.watch(authProvider.notifier).allUsers();
    final profiles = ref.watch(profileProvider);
    final subNotifier = ref.watch(subscriptionsProvider.notifier);
    final sub = subNotifier.activeFor(employer.id, SubscriberType.employerSme) ??
        subNotifier.activeFor(employer.id, SubscriberType.employerLarge);
    final hasSub = sub != null;

    final candidates = allUsers
        .where((u) => u.role == Role.candidate)
        .map((u) => (u, profiles[u.id]))
        .where((tuple) => tuple.$2 != null && tuple.$2!.selectedTemplateId != null)
        .map((tuple) => (tuple.$1, tuple.$2!))
        .where((tuple) {
      if (_field != 'all') {
        if (_field == 'it' && tuple.$2.field != FieldKind.it) return false;
        if (_field == 'non_it' && tuple.$2.field != FieldKind.nonIt) return false;
      }
      if (_type != 'all') {
        if (_type == 'fresher' && tuple.$2.type != CandidateType.fresher) return false;
        if (_type == 'experienced' && tuple.$2.type != CandidateType.experienced) return false;
      }
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF18181B) : Colors.white,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(icon: const Icon(Icons.arrow_back_rounded), onPressed: () => context.go('/employer/dashboard')),
        title: const Text('Candidates', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
        actions: const [ThemeToggle(), SizedBox(width: 12)],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('SEARCH CANDIDATES', style: TextStyle(fontSize: 11, letterSpacing: 2, fontWeight: FontWeight.w800, color: Color(0xFF0369A1))),
            const SizedBox(height: 6),
            Text(
              '${candidates.length} candidate${candidates.length == 1 ? "" : "s"} match your filters',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700, letterSpacing: -0.4, color: isDark ? Colors.white : const Color(0xFF09090B)),
            ),
            const SizedBox(height: 6),
            Text(
              hasSub ? 'Tap any card to view their full CV.' : 'Subscribe to unlock full CVs.',
              style: TextStyle(fontSize: 12.5, color: isDark ? Colors.white.withValues(alpha: 0.6) : const Color(0xFF52525B)),
            ),
            if (!hasSub) ...[
              const SizedBox(height: 14),
              Container(
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
                      onPressed: () => context.go('/employer/subscribe'),
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
              ),
            ],
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF18181B) : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE4E4E7)),
              ),
              child: Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _filter(isDark, _field, [('all', 'All fields'), ('it', 'IT'), ('non_it', 'Non-IT')], (v) => setState(() => _field = v)),
                  _filter(isDark, _type, [('all', 'Any type'), ('fresher', 'Fresher'), ('experienced', 'Experienced')], (v) => setState(() => _type = v)),
                ],
              ),
            ),
            const SizedBox(height: 16),
            MapListView(
              isDark: isDark,
              markerTone: MarkerTone.sky,
              items: candidates.map((tuple) {
                final user = tuple.$1;
                final profile = tuple.$2;
                final lat = profile.preferredLat ?? profile.currentLat;
                final lng = profile.preferredLng ?? profile.currentLng;
                return MapListItem(
                  id: user.id,
                  lat: lat,
                  lng: lng,
                  listBuilder: (ctx) => _CandidateCard(user: user, profile: profile, hasSub: hasSub, isDark: isDark),
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
          ],
        ),
      ),
    );
  }

  Widget _filter(bool isDark, String value, List<(String, String)> opts, ValueChanged<String> onChange) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.10) : const Color(0xFFE4E4E7)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          isDense: true,
          icon: Icon(Icons.keyboard_arrow_down_rounded, size: 16, color: isDark ? Colors.white.withValues(alpha: 0.5) : const Color(0xFF71717A)),
          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: isDark ? Colors.white : const Color(0xFF09090B)),
          dropdownColor: isDark ? const Color(0xFF18181B) : Colors.white,
          items: opts.map((o) => DropdownMenuItem(value: o.$1, child: Text(o.$2))).toList(),
          onChanged: (v) {
            if (v != null) onChange(v);
          },
        ),
      ),
    );
  }
}

class _CandidateCard extends StatelessWidget {
  const _CandidateCard({required this.user, required this.profile, required this.hasSub, required this.isDark});
  final User user;
  final CandidateProfile profile;
  final bool hasSub;
  final bool isDark;

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
        onTap: () => context.go('/employer/candidates/${user.id}'),
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF18181B) : Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: isDark ? Colors.white.withValues(alpha: 0.08) : const Color(0xFFE4E4E7)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(14),
                      gradient: const LinearGradient(colors: [Color(0xFF0EA5E9), Color(0xFF0369A1)]),
                    ),
                    child: Center(child: Text(initials, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 14))),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(hasSub ? user.name : '•••••• ••••••', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: isDark ? Colors.white : const Color(0xFF09090B))),
                        const SizedBox(height: 2),
                        Text(role, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 11.5, color: isDark ? Colors.white.withValues(alpha: 0.6) : const Color(0xFF52525B))),
                      ],
                    ),
                  ),
                  Icon(Icons.chevron_right_rounded, size: 18, color: isDark ? Colors.white.withValues(alpha: 0.4) : const Color(0xFFA1A1AA)),
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
                  if (profile.type == CandidateType.experienced) _pill(Icons.work_rounded, 'Experienced', const Color(0xFF7C3AED), isDark),
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
                    child: Text(
                      profile.preferredLocation!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: 11.5, color: isDark ? Colors.white.withValues(alpha: 0.7) : const Color(0xFF52525B)),
                    ),
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
