import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../store/auth_provider.dart';
import '../store/jobs_provider.dart';
import '../widgets/staff/staff_scaffold.dart';

/// Staff landing. Two counters (employers I manage, jobs I've posted) +
/// two big action cards for the workflows staff actually spend time on.
class StaffDashboardPage extends ConsumerWidget {
  const StaffDashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final me = ref.watch(authProvider);
    if (me == null || me.role != Role.staff) {
      WidgetsBinding.instance.addPostFrameCallback((_) => context.go('/staff/login'));
      return const SizedBox.shrink();
    }

    final users = ref.watch(authProvider.notifier).allUsers();
    final employers = users.where((u) => u.role == Role.employer).toList();
    final myProvisioned = employers.where((u) => u.createdByStaffId == me.id).toList();
    final jobs = ref.watch(jobsProvider);
    final providedEmployerIds = myProvisioned.map((u) => u.id).toSet();
    final myJobs = jobs.where((j) => providedEmployerIds.contains(j.employerId)).toList();
    final activeJobs = myJobs.where((j) => !j.isExpired).toList();

    return StaffScaffold(
      title: 'Dashboard',
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'STAFF · POST JOBS FOR EMPLOYERS',
              style: TextStyle(
                fontSize: 11,
                letterSpacing: 2,
                fontWeight: FontWeight.w800,
                color: Color(0xFF0D9488),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Hi ${me.name.split(' ').first}, ready to publish?',
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.4,
                color: Color(0xFF09090B),
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Add employers to the master, pick one, and post a job. Credentials are generated automatically — hand them to the employer so they can sign in on the employer portal.',
              style: TextStyle(fontSize: 12.5, color: Color(0xFF52525B), height: 1.45),
            ),
            const SizedBox(height: 20),
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 1.15,
              children: [
                _Tile(
                  label: 'Employers in master',
                  value: employers.length,
                  icon: Icons.business_center_rounded,
                  gradient: const [Color(0xFF0EA5E9), Color(0xFF0369A1)],
                ),
                _Tile(
                  label: 'Provisioned by me',
                  value: myProvisioned.length,
                  icon: Icons.groups_rounded,
                  gradient: const [Color(0xFF14B8A6), Color(0xFF10B981)],
                ),
                _Tile(
                  label: "Jobs I've posted",
                  value: myJobs.length,
                  icon: Icons.work_rounded,
                  gradient: const [Color(0xFF8B5CF6), Color(0xFF6D28D9)],
                ),
                _Tile(
                  label: 'Active jobs',
                  value: activeJobs.length,
                  icon: Icons.local_fire_department_rounded,
                  gradient: const [Color(0xFF10B981), Color(0xFF047857)],
                ),
              ],
            ),
            const SizedBox(height: 22),
            _ActionCard(
              icon: Icons.add_rounded,
              title: 'Post a job',
              body: 'Pick an employer from the master (or create one on the fly) and publish a role.',
              tone: const [Color(0xFFF97316), Color(0xFFEA580C)],
              onTap: () => context.go('/staff/jobs/new'),
            ),
            const SizedBox(height: 10),
            _ActionCard(
              icon: Icons.business_center_rounded,
              title: 'Employer Master',
              body: 'Add, edit, or reset passwords for the employers you manage.',
              tone: const [Color(0xFF0EA5E9), Color(0xFF0369A1)],
              onTap: () => context.go('/staff/employers'),
            ),
          ],
        ),
      ),
    );
  }
}

class _Tile extends StatelessWidget {
  const _Tile({
    required this.label,
    required this.value,
    required this.icon,
    required this.gradient,
  });
  final String label;
  final int value;
  final IconData icon;
  final List<Color> gradient;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE4E4E7)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: gradient),
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: gradient.last.withValues(alpha: 0.35),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Icon(icon, size: 20, color: Colors.white),
          ),
          const Spacer(),
          Text(
            label.toUpperCase(),
            style: const TextStyle(
              fontSize: 10,
              letterSpacing: 1.4,
              fontWeight: FontWeight.w800,
              color: Color(0xFF71717A),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            '$value',
            style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: Color(0xFF09090B)),
          ),
        ],
      ),
    );
  }
}

class _ActionCard extends StatelessWidget {
  const _ActionCard({
    required this.icon,
    required this.title,
    required this.body,
    required this.tone,
    required this.onTap,
  });
  final IconData icon;
  final String title;
  final String body;
  final List<Color> tone;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(22),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: const Color(0xFFE4E4E7)),
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: tone),
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: tone.last.withValues(alpha: 0.35),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Icon(icon, size: 20, color: Colors.white),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Color(0xFF09090B)),
                    ),
                    Text(
                      body,
                      style: const TextStyle(fontSize: 12, color: Color(0xFF52525B), height: 1.4),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_rounded, size: 18, color: Color(0xFFA1A1AA)),
            ],
          ),
        ),
      ),
    );
  }
}
