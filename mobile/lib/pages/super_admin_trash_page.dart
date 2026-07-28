import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../api/admin_api.dart';
import '../api/api_client.dart';
import '../store/theme_provider.dart';
import '../widgets/theme_toggle.dart';

/// Mobile parity port of web's SuperAdminTrash.tsx. Same three actions:
/// restore, purge (permanent), empty trash. Purge + empty require the
/// user to type a keyword — kept as bottom-sheet flows for mobile ergo.
class SuperAdminTrashPage extends ConsumerStatefulWidget {
  const SuperAdminTrashPage({super.key});

  @override
  ConsumerState<SuperAdminTrashPage> createState() => _SuperAdminTrashPageState();
}

const _roleTabs = <_RoleTab>[
  _RoleTab(key: 'ALL', label: 'All', icon: Icons.groups_outlined),
  _RoleTab(key: 'CANDIDATE', label: 'Candidates', icon: Icons.person_outline),
  _RoleTab(key: 'EMPLOYER', label: 'Employers', icon: Icons.apartment_outlined),
  _RoleTab(key: 'STAFF', label: 'Staff', icon: Icons.manage_accounts_outlined),
  _RoleTab(key: 'ADMIN', label: 'Admin', icon: Icons.shield_outlined),
  _RoleTab(key: 'SUPER_ADMIN', label: 'Super', icon: Icons.workspace_premium_outlined),
];

class _SuperAdminTrashPageState extends ConsumerState<SuperAdminTrashPage> {
  String _tab = 'ALL';
  List<TrashUser> _items = [];
  final Set<String> _selected = {};
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final items = await AdminApi.instance.listTrash(role: _tab == 'ALL' ? null : _tab);
      if (!mounted) return;
      setState(() { _items = items; _loading = false; });
    } catch (e) {
      if (!mounted) return;
      final msg = e is ApiError && e.status == 403
          ? 'Only super-admins can view the trash.'
          : (e is ApiError ? e.message : e.toString());
      setState(() { _error = msg; _loading = false; });
    }
  }

  Future<void> _restore() async {
    final ids = _selected.toList();
    if (ids.isEmpty) return;
    final ok = await _confirm(
      title: 'Restore users?',
      body: '${ids.length} user${ids.length == 1 ? '' : 's'} will be restored and can log in again.',
      confirmLabel: 'Restore',
      confirmColor: const Color(0xFF059669),
    );
    if (ok != true) return;
    try {
      if (ids.length == 1) {
        await AdminApi.instance.restore(ids.first);
      } else {
        await AdminApi.instance.bulkRestore(ids);
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Restored ${ids.length}')));
      _selected.clear();
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Restore failed: $e'), backgroundColor: Colors.red));
    }
  }

  Future<void> _purge() async {
    final ids = _selected.toList();
    if (ids.isEmpty) return;
    final ok = await _typedConfirm(
      title: 'Permanently delete?',
      body: 'This CANNOT be undone. ${ids.length} user${ids.length == 1 ? '' : 's'} plus all their profiles, jobs, applications and subscriptions will be permanently removed. After purge, the email is freed and can be used to register a fresh account.',
      keyword: 'DELETE',
      confirmLabel: 'Delete forever',
    );
    if (ok != true) return;
    try {
      if (ids.length == 1) {
        await AdminApi.instance.purge(ids.first);
      } else {
        await AdminApi.instance.bulkPurge(ids);
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Purged ${ids.length}. Emails freed.')));
      _selected.clear();
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Purge failed: $e'), backgroundColor: Colors.red));
    }
  }

  Future<void> _empty() async {
    if (_items.isEmpty) return;
    final ok = await _typedConfirm(
      title: 'Empty trash?',
      body: 'Everything in the trash (${_items.length} user${_items.length == 1 ? '' : 's'}) will be permanently deleted along with all cascaded data. All emails will be freed for re-registration.',
      keyword: 'EMPTY',
      confirmLabel: 'Empty trash',
    );
    if (ok != true) return;
    try {
      final res = await AdminApi.instance.emptyTrash();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Emptied · ${res.succeeded} purged')));
      _selected.clear();
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Empty trash failed: $e'), backgroundColor: Colors.red));
    }
  }

  Future<bool?> _confirm({
    required String title,
    required String body,
    required String confirmLabel,
    required Color confirmColor,
  }) {
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: SafeArea(
          top: false,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
              const SizedBox(height: 10),
              Text(body, style: const TextStyle(fontSize: 13.5, height: 1.5)),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(child: OutlinedButton(onPressed: () => Navigator.of(context).pop(false), child: const Padding(padding: EdgeInsets.symmetric(vertical: 10), child: Text('Cancel')))),
                  const SizedBox(width: 10),
                  Expanded(
                    child: FilledButton(
                      style: FilledButton.styleFrom(backgroundColor: confirmColor),
                      onPressed: () => Navigator.of(context).pop(true),
                      child: Padding(padding: const EdgeInsets.symmetric(vertical: 10), child: Text(confirmLabel)),
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

  Future<bool?> _typedConfirm({
    required String title,
    required String body,
    required String keyword,
    required String confirmLabel,
  }) {
    final ctrl = TextEditingController();
    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setBottomState) {
          final canConfirm = ctrl.text.trim() == keyword;
          return Padding(
            padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
            child: Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Theme.of(context).scaffoldBackgroundColor,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              ),
              child: SafeArea(
                top: false,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDC2626).withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.warning_amber_rounded, color: Color(0xFFDC2626), size: 22),
                        ),
                        const SizedBox(width: 12),
                        Expanded(child: Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700))),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(body, style: const TextStyle(fontSize: 13.5, height: 1.5)),
                    const SizedBox(height: 16),
                    RichText(
                      text: TextSpan(
                        style: DefaultTextStyle.of(ctx).style.copyWith(fontSize: 13),
                        children: [
                          const TextSpan(text: 'Type '),
                          TextSpan(
                            text: keyword,
                            style: const TextStyle(fontWeight: FontWeight.w800, color: Color(0xFFDC2626), fontFamily: 'monospace'),
                          ),
                          const TextSpan(text: ' to confirm.'),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: ctrl,
                      autofocus: true,
                      onChanged: (_) => setBottomState(() {}),
                      decoration: const InputDecoration(border: OutlineInputBorder(), isDense: true),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(child: OutlinedButton(onPressed: () => Navigator.of(ctx).pop(false), child: const Padding(padding: EdgeInsets.symmetric(vertical: 10), child: Text('Cancel')))),
                        const SizedBox(width: 10),
                        Expanded(
                          child: FilledButton(
                            style: FilledButton.styleFrom(backgroundColor: const Color(0xFFDC2626)),
                            onPressed: canConfirm ? () => Navigator.of(ctx).pop(true) : null,
                            child: Padding(padding: const EdgeInsets.symmetric(vertical: 10), child: Text(confirmLabel)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = ref.watch(themeProvider) == ThemeMode.dark;
    final bg = isDark ? const Color(0xFF09090B) : const Color(0xFFFAFAFA);
    final surface = isDark ? const Color(0xFF18181B) : Colors.white;

    return Scaffold(
      backgroundColor: bg,
      appBar: AppBar(
        backgroundColor: bg,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.canPop() ? context.pop() : context.go('/super-admin/dashboard'),
        ),
        title: const Text('Trash', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
        actions: [
          IconButton(
            tooltip: 'Empty trash',
            icon: const Icon(Icons.local_fire_department_outlined, color: Color(0xFFDC2626)),
            onPressed: _items.isEmpty ? null : _empty,
          ),
          const ThemeToggle(),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          SizedBox(
            height: 44,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: _roleTabs.length,
              separatorBuilder: (_, __) => const SizedBox(width: 6),
              itemBuilder: (_, i) {
                final t = _roleTabs[i];
                final active = t.key == _tab;
                return ChoiceChip(
                  label: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [Icon(t.icon, size: 14), const SizedBox(width: 4), Text(t.label)],
                  ),
                  selected: active,
                  onSelected: (_) {
                    setState(() { _tab = t.key; _selected.clear(); });
                    _load();
                  },
                );
              },
            ),
          ),

          if (_selected.isNotEmpty)
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.amber.withValues(alpha: 0.10),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.amber.withValues(alpha: 0.30)),
              ),
              child: Row(
                children: [
                  Expanded(child: Text('${_selected.length} selected', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF92400E)))),
                  TextButton(onPressed: () => setState(_selected.clear), child: const Text('Clear')),
                  const SizedBox(width: 4),
                  FilledButton.icon(
                    style: FilledButton.styleFrom(backgroundColor: const Color(0xFF059669)),
                    onPressed: _restore,
                    icon: const Icon(Icons.restore_from_trash_outlined, size: 15),
                    label: const Text('Restore'),
                  ),
                  const SizedBox(width: 6),
                  FilledButton.icon(
                    style: FilledButton.styleFrom(backgroundColor: const Color(0xFFDC2626)),
                    onPressed: _purge,
                    icon: const Icon(Icons.delete_forever_outlined, size: 15),
                    label: const Text('Purge'),
                  ),
                ],
              ),
            ),

          if (_error != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              child: Text(_error!, style: const TextStyle(color: Color(0xFFDC2626))),
            ),

          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _items.isEmpty
                    ? const Center(child: Text('The trash is empty.'))
                    : RefreshIndicator(
                        onRefresh: _load,
                        child: ListView.separated(
                          padding: const EdgeInsets.fromLTRB(12, 4, 12, 80),
                          itemCount: _items.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 6),
                          itemBuilder: (_, i) {
                            final u = _items[i];
                            final selected = _selected.contains(u.id);
                            return Card(
                              margin: EdgeInsets.zero,
                              color: selected ? const Color(0xFFDC2626).withValues(alpha: 0.06) : surface,
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                                side: BorderSide(color: isDark ? Colors.white12 : Colors.black12),
                              ),
                              child: CheckboxListTile(
                                value: selected,
                                onChanged: (_) => setState(() {
                                  if (selected) { _selected.remove(u.id); } else { _selected.add(u.id); }
                                }),
                                controlAffinity: ListTileControlAffinity.leading,
                                title: Text(
                                  u.companyName != null ? '${u.name} · ${u.companyName}' : u.name,
                                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                                ),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(u.email, style: const TextStyle(fontSize: 12.5)),
                                    Text(
                                      '${u.role.replaceAll('_', ' ')} · deleted ${_dateStr(u.deletedAt)}',
                                      style: TextStyle(fontSize: 11, color: isDark ? Colors.white54 : Colors.black54),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  static String _dateStr(String iso) {
    try {
      final d = DateTime.parse(iso).toLocal();
      return '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')} ${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return iso;
    }
  }
}

class _RoleTab {
  const _RoleTab({required this.key, required this.label, required this.icon});
  final String key;
  final String label;
  final IconData icon;
}
