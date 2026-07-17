import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../store/auth_provider.dart';
import '../store/jobs_provider.dart';
import '../widgets/staff/credential_share_sheet.dart';
import '../widgets/staff/staff_scaffold.dart';

/// Employer Master — the directory staff manages. Shows every employer on
/// the platform; staff-provisioned rows expose reveal + copy + reset for
/// the shared password. Self-registered employers show up too but their
/// password column is a dash (they log in via OTP).
class StaffEmployersPage extends ConsumerStatefulWidget {
  const StaffEmployersPage({super.key});

  @override
  ConsumerState<StaffEmployersPage> createState() => _StaffEmployersPageState();
}

class _StaffEmployersPageState extends ConsumerState<StaffEmployersPage> {
  final _search = TextEditingController();
  bool _ownedOnly = false;
  final Set<String> _revealed = {};
  int _tick = 0;

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
    final jobs = ref.watch(jobsProvider);

    final query = _search.text.trim().toLowerCase();
    final employers = users.where((u) {
      if (u.role != Role.employer) return false;
      if (_ownedOnly && u.createdByStaffId != me.id) return false;
      if (query.isEmpty) return true;
      return u.name.toLowerCase().contains(query) ||
          u.email.toLowerCase().contains(query) ||
          (u.company ?? '').toLowerCase().contains(query) ||
          (u.mobile ?? '').contains(query);
    }).toList()
      ..sort((a, b) => a.name.compareTo(b.name));

    final jobCounts = <String, int>{};
    for (final j in jobs) {
      jobCounts[j.employerId] = (jobCounts[j.employerId] ?? 0) + 1;
    }

    return StaffScaffold(
      title: 'Employer Master',
      action: IconButton(
        icon: const Icon(Icons.person_add_alt_1_rounded, size: 20),
        color: const Color(0xFF10B981),
        tooltip: 'Add employer',
        onPressed: () => context.go('/staff/employers/new'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 4),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${employers.length} employer${employers.length == 1 ? "" : "s"}',
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Color(0xFF09090B)),
                ),
                const SizedBox(height: 2),
                const Text(
                  'Pick any of them when posting a job. Passwords are visible only for accounts you provisioned.',
                  style: TextStyle(fontSize: 12, color: Color(0xFF52525B), height: 1.4),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _search,
                  onChanged: (_) => setState(() {}),
                  style: const TextStyle(fontSize: 13),
                  decoration: InputDecoration(
                    prefixIcon: const Icon(Icons.search_rounded, size: 18, color: Color(0xFFA1A1AA)),
                    hintText: 'Search name, email, company…',
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
                const SizedBox(height: 8),
                Row(
                  children: [
                    FilterChip(
                      label: const Text('Only mine', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700)),
                      selected: _ownedOnly,
                      selectedColor: const Color(0xFF10B981).withValues(alpha: 0.20),
                      checkmarkColor: const Color(0xFF047857),
                      backgroundColor: Colors.white,
                      side: BorderSide(
                        color: _ownedOnly ? const Color(0xFF10B981) : const Color(0xFFE4E4E7),
                      ),
                      onSelected: (v) => setState(() => _ownedOnly = v),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Expanded(
            child: employers.isEmpty
                ? _EmptyState(hasQuery: query.isNotEmpty)
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
                    itemCount: employers.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, i) {
                      final u = employers[i];
                      return _EmployerCard(
                        // Force a re-render on toggle/reset by keying on the tick.
                        key: ValueKey('${u.id}_$_tick'),
                        user: u,
                        provisionedByMe: u.createdByStaffId == me.id,
                        jobCount: jobCounts[u.id] ?? 0,
                        revealed: _revealed.contains(u.id),
                        onToggleReveal: () {
                          HapticFeedback.selectionClick();
                          setState(() {
                            if (_revealed.contains(u.id)) {
                              _revealed.remove(u.id);
                            } else {
                              _revealed.add(u.id);
                            }
                          });
                        },
                        onCopy: (text) async {
                          await Clipboard.setData(ClipboardData(text: text));
                          HapticFeedback.lightImpact();
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Password copied', style: TextStyle(fontSize: 12.5)),
                                backgroundColor: Color(0xFF10B981),
                                behavior: SnackBarBehavior.floating,
                                duration: Duration(milliseconds: 1400),
                              ),
                            );
                          }
                        },
                        onReset: () async {
                          final ok = await showDialog<bool>(
                            context: context,
                            builder: (_) => AlertDialog(
                              title: Text('Reset password for ${u.name}?'),
                              content: const Text('The old password will stop working immediately.'),
                              actions: [
                                TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
                                FilledButton(
                                  onPressed: () => Navigator.pop(context, true),
                                  style: FilledButton.styleFrom(backgroundColor: const Color(0xFFF59E0B)),
                                  child: const Text('Reset'),
                                ),
                              ],
                            ),
                          );
                          if (ok != true || !context.mounted) return;
                          try {
                            final password = await ref.read(authProvider.notifier).resetEmployerPassword(u.id);
                            setState(() => _tick++);
                            if (!context.mounted) return;
                            await CredentialShareSheet.show(
                              context,
                              title: 'Password reset',
                              subtitle: 'New credentials for ${u.name}',
                              email: u.email,
                              password: password,
                            );
                          } catch (_) {
                            if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Could not reset password.')),
                            );
                          }
                        },
                        onEdit: () => context.go('/staff/employers/${u.id}'),
                        onPostJob: () => context.go('/staff/jobs/new?employerId=${u.id}'),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.hasQuery});
  final bool hasQuery;

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
              color: const Color(0xFF10B981).withValues(alpha: 0.10),
            ),
            child: const Icon(Icons.business_center_rounded, size: 32, color: Color(0xFF047857)),
          ),
          const SizedBox(height: 12),
          const Text(
            'No employers match',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Color(0xFF09090B)),
          ),
          const SizedBox(height: 4),
          Text(
            hasQuery
                ? 'Try a different search term.'
                : 'Add the first employer to start posting jobs on their behalf.',
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 12, color: Color(0xFF71717A)),
          ),
          if (!hasQuery) ...[
            const SizedBox(height: 14),
            ElevatedButton.icon(
              onPressed: () => (context).go('/staff/employers/new'),
              icon: const Icon(Icons.person_add_alt_1_rounded, size: 14),
              label: const Text('Add employer', style: TextStyle(fontWeight: FontWeight.w700)),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _EmployerCard extends StatelessWidget {
  const _EmployerCard({
    super.key,
    required this.user,
    required this.provisionedByMe,
    required this.jobCount,
    required this.revealed,
    required this.onToggleReveal,
    required this.onCopy,
    required this.onReset,
    required this.onEdit,
    required this.onPostJob,
  });

  final User user;
  final bool provisionedByMe;
  final int jobCount;
  final bool revealed;
  final VoidCallback onToggleReveal;
  final ValueChanged<String> onCopy;
  final VoidCallback onReset;
  final VoidCallback onEdit;
  final VoidCallback onPostJob;

  @override
  Widget build(BuildContext context) {
    final hasPwd = user.sharedPassword != null;
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
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [Color(0xFF0EA5E9), Color(0xFF0369A1)]),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Text(
                    user.name.split(RegExp(r'\s+')).take(2).map((p) => p.isEmpty ? '' : p[0].toUpperCase()).join(),
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 13),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user.name,
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Color(0xFF09090B)),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      user.company ?? user.email,
                      style: const TextStyle(fontSize: 11.5, color: Color(0xFF52525B)),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              if (provisionedByMe)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFF14B8A6).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: const Text(
                    'YOURS',
                    style: TextStyle(fontSize: 9, letterSpacing: 1.4, fontWeight: FontWeight.w800, color: Color(0xFF0F766E)),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              const Icon(Icons.mail_outline_rounded, size: 12, color: Color(0xFF71717A)),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  user.email,
                  style: const TextStyle(fontSize: 11.5, color: Color(0xFF52525B)),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (user.mobile != null) ...[
                const SizedBox(width: 8),
                const Icon(Icons.phone_rounded, size: 12, color: Color(0xFF71717A)),
                const SizedBox(width: 4),
                Text(
                  user.mobile!,
                  style: const TextStyle(fontSize: 11.5, color: Color(0xFF52525B)),
                ),
              ],
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFFF4F4F5),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  '$jobCount ${jobCount == 1 ? "job" : "jobs"}',
                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Color(0xFF52525B)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (hasPwd)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFFAFAFA),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFE4E4E7)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.key_rounded, size: 12, color: Color(0xFF71717A)),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      revealed ? user.sharedPassword! : '••••••••••',
                      style: const TextStyle(
                        fontFamily: 'monospace',
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF09090B),
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: onToggleReveal,
                    icon: Icon(
                      revealed ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                      size: 16,
                      color: const Color(0xFF71717A),
                    ),
                    visualDensity: VisualDensity.compact,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                    tooltip: revealed ? 'Hide password' : 'Reveal password',
                  ),
                  IconButton(
                    onPressed: () => onCopy(user.sharedPassword!),
                    icon: const Icon(Icons.copy_rounded, size: 15, color: Color(0xFF71717A)),
                    visualDensity: VisualDensity.compact,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                    tooltip: 'Copy password',
                  ),
                ],
              ),
            )
          else
            const Text(
              'self-registered · OTP only',
              style: TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: Color(0xFFA1A1AA)),
            ),
          const SizedBox(height: 10),
          Row(
            children: [
              if (hasPwd)
                Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: OutlinedButton.icon(
                    onPressed: onReset,
                    icon: const Icon(Icons.refresh_rounded, size: 12),
                    label: const Text('Reset', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      foregroundColor: const Color(0xFFB45309),
                      side: const BorderSide(color: Color(0xFFFCD34D)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                    ),
                  ),
                ),
              OutlinedButton.icon(
                onPressed: onEdit,
                icon: const Icon(Icons.edit_outlined, size: 12),
                label: const Text('Edit', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  foregroundColor: const Color(0xFF52525B),
                  side: const BorderSide(color: Color(0xFFE4E4E7)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                ),
              ),
              const Spacer(),
              ElevatedButton.icon(
                onPressed: onPostJob,
                icon: const Icon(Icons.work_rounded, size: 12),
                label: const Text('Post job', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF10B981),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
