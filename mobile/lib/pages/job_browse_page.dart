import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../store/jobs_provider.dart';
import '../store/theme_provider.dart';
import '../widgets/theme_toggle.dart';
import '../widgets/map_list_view.dart';

class JobBrowsePage extends ConsumerStatefulWidget {
  const JobBrowsePage({super.key});

  @override
  ConsumerState<JobBrowsePage> createState() => _JobBrowsePageState();
}

class _JobBrowsePageState extends ConsumerState<JobBrowsePage> {
  final _search = TextEditingController();
  String _fieldFilter = 'all';
  String _expFilter = 'all';
  String _locationFilter = 'all';

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  List<Job> _filtered(List<Job> jobs) {
    return jobs.where((j) {
      if (_fieldFilter != 'all') {
        if (_fieldFilter == 'it' && j.field != JobField.it) return false;
        if (_fieldFilter == 'non_it' && j.field != JobField.nonIt) return false;
      }
      if (_expFilter != 'all') {
        if (_expFilter == 'fresher' &&
            j.experience != JobExperience.fresher &&
            j.experience != JobExperience.any) {
          return false;
        }
        if (_expFilter == 'experienced' &&
            j.experience != JobExperience.experienced &&
            j.experience != JobExperience.any) {
          return false;
        }
      }
      if (_locationFilter != 'all' && j.location != _locationFilter) return false;
      final q = _search.text.trim().toLowerCase();
      if (q.isNotEmpty) {
        final hay = '${j.title} ${j.employerName} ${j.description} ${j.skills.join(" ")}'.toLowerCase();
        if (!hay.contains(q)) return false;
      }
      return true;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final jobs = ref.watch(jobsProvider);
    final filtered = _filtered(jobs);
    final locations = jobs.map((j) => j.location).toSet().toList()..sort();

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
        title: const Text('Browse jobs', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
        actions: const [ThemeToggle(), SizedBox(width: 12)],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'OPENINGS ACROSS TAMIL NADU',
              style: TextStyle(
                fontSize: 11,
                letterSpacing: 2,
                fontWeight: FontWeight.w800,
                color: Color(0xFFEA580C),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              '${filtered.length} ${filtered.length == 1 ? "job" : "jobs"} match your filters',
              style: TextStyle(
                fontSize: 13,
                color: isDark
                    ? Colors.white.withValues(alpha: 0.6)
                    : const Color(0xFF52525B),
              ),
            ),
            const SizedBox(height: 16),

            // Filters
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF18181B) : Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.08)
                      : const Color(0xFFE4E4E7),
                ),
              ),
              child: Column(
                children: [
                  TextField(
                    controller: _search,
                    onChanged: (_) => setState(() {}),
                    style: TextStyle(
                      fontSize: 13,
                      color: isDark ? Colors.white : const Color(0xFF09090B),
                    ),
                    decoration: InputDecoration(
                      hintText: 'Search role, company, skill...',
                      hintStyle: TextStyle(
                        fontSize: 12.5,
                        color: isDark
                            ? Colors.white.withValues(alpha: 0.3)
                            : const Color(0xFFA1A1AA),
                      ),
                      prefixIcon: Icon(
                        Icons.search_rounded,
                        size: 18,
                        color: isDark
                            ? Colors.white.withValues(alpha: 0.5)
                            : const Color(0xFFA1A1AA),
                      ),
                      isDense: true,
                      filled: true,
                      fillColor: isDark
                          ? const Color(0xFF09090B)
                          : const Color(0xFFFAFAFA),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                      border: _border(isDark),
                      enabledBorder: _border(isDark),
                      focusedBorder: _border(isDark, focused: true),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _FilterDropdown(
                        value: _fieldFilter,
                        isDark: isDark,
                        options: const [
                          ('all', 'All fields'),
                          ('it', 'IT'),
                          ('non_it', 'Non-IT'),
                        ],
                        onChange: (v) => setState(() => _fieldFilter = v),
                      ),
                      _FilterDropdown(
                        value: _expFilter,
                        isDark: isDark,
                        options: const [
                          ('all', 'Any experience'),
                          ('fresher', 'Fresher'),
                          ('experienced', 'Experienced'),
                        ],
                        onChange: (v) => setState(() => _expFilter = v),
                      ),
                      _FilterDropdown(
                        value: _locationFilter,
                        isDark: isDark,
                        options: [
                          const ('all', 'All locations'),
                          ...locations.map((l) => (l, l)),
                        ],
                        onChange: (v) => setState(() => _locationFilter = v),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Map + list
            MapListView(
              isDark: isDark,
              markerTone: MarkerTone.brand,
              items: filtered
                  .map((job) => MapListItem(
                        id: job.id,
                        lat: job.lat,
                        lng: job.lng,
                        listBuilder: (ctx) => _JobCard(
                          job: job,
                          isDark: isDark,
                          onTap: () => context.go('/candidate/jobs/${job.id}'),
                        ),
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
          ],
        ),
      ),
    );
  }

  OutlineInputBorder _border(bool isDark, {bool focused = false}) {
    return OutlineInputBorder(
      borderRadius: BorderRadius.circular(14),
      borderSide: BorderSide(
        color: focused
            ? const Color(0xFFF97316)
            : (isDark
                ? Colors.white.withValues(alpha: 0.10)
                : const Color(0xFFE4E4E7)),
        width: focused ? 1.5 : 1,
      ),
    );
  }
}

class _FilterDropdown extends StatelessWidget {
  const _FilterDropdown({
    required this.value,
    required this.options,
    required this.onChange,
    required this.isDark,
  });

  final String value;
  final List<(String, String)> options;
  final ValueChanged<String> onChange;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isDark
              ? Colors.white.withValues(alpha: 0.10)
              : const Color(0xFFE4E4E7),
        ),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          isDense: true,
          icon: Icon(
            Icons.keyboard_arrow_down_rounded,
            size: 16,
            color: isDark
                ? Colors.white.withValues(alpha: 0.5)
                : const Color(0xFF71717A),
          ),
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: isDark ? Colors.white : const Color(0xFF09090B),
          ),
          dropdownColor: isDark ? const Color(0xFF18181B) : Colors.white,
          items: options
              .map((o) => DropdownMenuItem(value: o.$1, child: Text(o.$2)))
              .toList(),
          onChanged: (v) {
            if (v != null) onChange(v);
          },
        ),
      ),
    );
  }
}

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
    final freshersWelcome = job.experience == JobExperience.fresher ||
        job.experience == JobExperience.any;
    final isInternship = job.type == JobType.internship;

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
            border: Border.all(
              color: isDark
                  ? Colors.white.withValues(alpha: 0.08)
                  : const Color(0xFFE4E4E7),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      gradient: LinearGradient(
                        colors: isIt
                            ? const [Color(0xFF0EA5E9), Color(0xFF0369A1)]
                            : const [Color(0xFFF97316), Color(0xFFC2410C)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: (isIt
                                  ? const Color(0xFF0EA5E9)
                                  : const Color(0xFFF97316))
                              .withValues(alpha: 0.35),
                          blurRadius: 8,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Center(
                      child: Text(
                        _initials,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          job.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: isDark ? Colors.white : const Color(0xFF09090B),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          job.employerName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 11.5,
                            color: isDark
                                ? Colors.white.withValues(alpha: 0.6)
                                : const Color(0xFF52525B),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Icon(
                    Icons.chevron_right_rounded,
                    size: 20,
                    color: isDark
                        ? Colors.white.withValues(alpha: 0.4)
                        : const Color(0xFFA1A1AA),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: [
                  _Pill(text: job.location, icon: Icons.place_rounded, color: const Color(0xFF71717A), isDark: isDark),
                  _Pill(
                    text: fieldLabel[job.field]!,
                    icon: isIt ? Icons.code_rounded : Icons.business_center_rounded,
                    color: isIt ? const Color(0xFF0284C7) : const Color(0xFFD97706),
                    isDark: isDark,
                  ),
                  _Pill(text: typeLabel[job.type]!, icon: Icons.work_outline_rounded, color: const Color(0xFF7C3AED), isDark: isDark),
                  if (freshersWelcome && !isInternship)
                    _Pill(text: 'Freshers welcome', icon: Icons.auto_awesome_rounded, color: const Color(0xFF059669), isDark: isDark),
                  if (isInternship)
                    _Pill(text: 'Internship', icon: Icons.school_rounded, color: const Color(0xFFE11D48), isDark: isDark),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                job.description,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 12,
                  height: 1.45,
                  color: isDark
                      ? Colors.white.withValues(alpha: 0.6)
                      : const Color(0xFF52525B),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Text(
                    job.salaryRange ?? 'Competitive',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF059669),
                    ),
                  ),
                  const Spacer(),
                  Icon(
                    Icons.access_time_rounded,
                    size: 11,
                    color: isDark
                        ? Colors.white.withValues(alpha: 0.4)
                        : const Color(0xFFA1A1AA),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    relativeTime(job.postedAt),
                    style: TextStyle(
                      fontSize: 10.5,
                      color: isDark
                          ? Colors.white.withValues(alpha: 0.5)
                          : const Color(0xFF71717A),
                    ),
                  ),
                ],
              ),
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
            Row(
              children: [
                Container(
                  width: 36, height: 36,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(10),
                    gradient: LinearGradient(
                      colors: isIt
                          ? const [Color(0xFF0EA5E9), Color(0xFF0369A1)]
                          : const [Color(0xFFF97316), Color(0xFFC2410C)],
                    ),
                  ),
                  child: Center(
                    child: Icon(isIt ? Icons.code_rounded : Icons.business_center_rounded, size: 16, color: Colors.white),
                  ),
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
              ],
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 6, runSpacing: 6,
              children: [
                _Pill(text: job.location, icon: Icons.place_rounded, color: const Color(0xFF71717A), isDark: isDark),
                _Pill(text: typeLabel[job.type]!, icon: Icons.work_outline_rounded, color: const Color(0xFF7C3AED), isDark: isDark),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Text(job.salaryRange ?? 'Competitive', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Color(0xFF059669))),
                const Spacer(),
                const Text('View →', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFFF97316))),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill({
    required this.text,
    required this.icon,
    required this.color,
    required this.isDark,
  });
  final String text;
  final IconData icon;
  final Color color;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: isDark ? 0.18 : 0.10),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 10, color: color),
          const SizedBox(width: 4),
          Text(
            text,
            style: TextStyle(
              fontSize: 9.5,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
