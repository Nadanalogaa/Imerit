import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../store/auth_provider.dart';
import '../store/jobs_provider.dart';
import '../widgets/staff/staff_scaffold.dart';

/// "Jobs I've posted" for staff. Approximates ownership via
/// `createdByStaffId` on the employer — see the comment in the web
/// version for the same caveat (a real backend should stamp
/// `postedByStaffId` on Job).
class StaffJobsPage extends ConsumerStatefulWidget {
  const StaffJobsPage({super.key});

  @override
  ConsumerState<StaffJobsPage> createState() => _StaffJobsPageState();
}

class _StaffJobsPageState extends ConsumerState<StaffJobsPage> {
  final _search = TextEditingController();

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final me = ref.watch(authProvider);
    if (me == null || me.role != Role.staff) {
      WidgetsBinding.instance.addPostFrameCallback((_) => context.go('/staff/login'));
      return const SizedBox.shrink();
    }

    final users = ref.watch(authProvider.notifier).allUsers();
    final myEmployerIds =
        users.where((u) => u.createdByStaffId == me.id).map((u) => u.id).toSet();
    final allJobs = ref.watch(jobsProvider);
    final query = _search.text.trim().toLowerCase();
    final mine = allJobs.where((j) {
      if (!myEmployerIds.contains(j.employerId)) return false;
      if (query.isEmpty) return true;
      return j.title.toLowerCase().contains(query) ||
          j.employerName.toLowerCase().contains(query) ||
          j.location.toLowerCase().contains(query);
    }).toList()
      ..sort((a, b) => b.postedAt.compareTo(a.postedAt));

    final activeCount = mine.where((j) => !j.isExpired).length;
    final expiredCount = mine.length - activeCount;

    return StaffScaffold(
      title: 'My jobs',
      action: IconButton(
        icon: const Icon(Icons.add_rounded, size: 22),
        color: const Color(0xFFF97316),
        tooltip: 'Post job',
        onPressed: () => context.go('/staff/jobs/new'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${mine.length} job${mine.length == 1 ? "" : "s"} across ${myEmployerIds.length} employer${myEmployerIds.length == 1 ? "" : "s"}',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF09090B)),
                ),
                if (expiredCount > 0) ...[
                  const SizedBox(height: 4),
                  Text(
                    '$activeCount active · $expiredCount expired',
                    style: const TextStyle(fontSize: 11.5, color: Color(0xFF71717A)),
                  ),
                ],
                const SizedBox(height: 12),
                TextField(
                  controller: _search,
                  onChanged: (_) => setState(() {}),
                  style: const TextStyle(fontSize: 13),
                  decoration: InputDecoration(
                    prefixIcon: const Icon(Icons.search_rounded, size: 18, color: Color(0xFFA1A1AA)),
                    hintText: 'Search title, employer, location…',
                    hintStyle: const TextStyle(fontSize: 12.5, color: Color(0xFFA1A1AA)),
                    isDense: true,
                    filled: true,
                    fillColor: Colors.white,
                    contentPadding: const EdgeInsets.symmetric(vertical: 12),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: const BorderSide(color: Color(0xFFE4E4E7)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: const BorderSide(color: Color(0xFFE4E4E7)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: const BorderSide(color: Color(0xFF10B981), width: 1.5),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: mine.isEmpty
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 72,
                            height: 72,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: const Color(0xFFF97316).withValues(alpha: 0.10),
                            ),
                            child: const Icon(Icons.work_history_rounded, size: 32, color: Color(0xFFEA580C)),
                          ),
                          const SizedBox(height: 12),
                          const Text(
                            'Nothing posted yet',
                            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Color(0xFF09090B)),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Post a job on behalf of an employer to see it here.',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 12, color: Color(0xFF71717A)),
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton.icon(
                            onPressed: () => context.go('/staff/jobs/new'),
                            icon: const Icon(Icons.add_rounded, size: 14),
                            label: const Text('Post your first job', style: TextStyle(fontWeight: FontWeight.w700)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFF97316),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
                    itemCount: mine.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, i) {
                      final j = mine[i];
                      return _JobCard(job: j);
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

class _JobCard extends StatelessWidget {
  const _JobCard({required this.job});
  final Job job;

  @override
  Widget build(BuildContext context) {
    final expired = job.isExpired;
    final daysLeft = job.daysUntilExpiry;
    final tone = expired
        ? const Color(0xFFE11D48)
        : (daysLeft <= 5 ? const Color(0xFFF59E0B) : const Color(0xFF10B981));

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE4E4E7)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFFF97316), Color(0xFFEA580C)]),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(Icons.work_rounded, size: 20, color: Colors.white),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  job.title,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Color(0xFF09090B)),
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  '${job.employerName} · ${job.location}',
                  style: const TextStyle(fontSize: 11.5, color: Color(0xFF52525B)),
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: tone.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.timer_rounded, size: 10, color: tone),
                          const SizedBox(width: 4),
                          Text(
                            expired ? 'Expired' : '$daysLeft days left',
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: tone),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'Posted ${relativeTime(job.postedAt)}',
                      style: const TextStyle(fontSize: 10.5, color: Color(0xFF71717A)),
                    ),
                  ],
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: () => context.go('/employer/jobs/${job.id}/applicants'),
            icon: const Icon(Icons.people_outline_rounded, size: 18),
            tooltip: 'Applicants',
            color: const Color(0xFF10B981),
          ),
        ],
      ),
    );
  }
}
