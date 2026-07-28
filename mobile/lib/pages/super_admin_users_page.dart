import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../api/admin_api.dart';
import '../api/api_client.dart';
import '../store/theme_provider.dart';
import '../widgets/theme_toggle.dart';

/// Mobile parity port of web's SuperAdminUsers.tsx — list all users with
/// role filter + multi-select + move-to-trash. All destructive gestures
/// bubble through a confirmation sheet.
class SuperAdminUsersPage extends ConsumerStatefulWidget {
  const SuperAdminUsersPage({super.key});

  @override
  ConsumerState<SuperAdminUsersPage> createState() => _SuperAdminUsersPageState();
}

const _pageSize = 25;

const _roleTabs = <_RoleTab>[
  _RoleTab(key: 'ALL', label: 'All', icon: Icons.groups_outlined),
  _RoleTab(key: 'CANDIDATE', label: 'Candidates', icon: Icons.person_outline),
  _RoleTab(key: 'EMPLOYER', label: 'Employers', icon: Icons.apartment_outlined),
  _RoleTab(key: 'STAFF', label: 'Staff', icon: Icons.manage_accounts_outlined),
  _RoleTab(key: 'ADMIN', label: 'Admin', icon: Icons.shield_outlined),
  _RoleTab(key: 'SUPER_ADMIN', label: 'Super', icon: Icons.workspace_premium_outlined),
];

class _SuperAdminUsersPageState extends ConsumerState<SuperAdminUsersPage> {
  String _tab = 'ALL';
  String _search = '';
  int _page = 1;
  int _total = 0;
  List<AdminUserItem> _items = [];
  bool _loading = false;
  String? _error;
  final Set<String> _selected = {};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final res = await AdminApi.instance.listUsers(
        role: _tab == 'ALL' ? null : _tab,
        search: _search.isEmpty ? null : _search,
        page: _page,
        pageSize: _pageSize,
      );
      if (!mounted) return;
      setState(() { _items = res.items; _total = res.total; _loading = false; });
    } catch (e) {
      if (!mounted) return;
      final msg = e is ApiError && e.status == 403
          ? 'Only super-admins can manage users.'
          : (e is ApiError ? e.message : e.toString());
      setState(() { _error = msg; _loading = false; });
    }
  }

  Future<void> _confirmAndDelete() async {
    final ids = _selected.toList();
    if (ids.isEmpty) return;
    final ok = await _showDeleteSheet(ids.length);
    if (ok != true) return;
    try {
      if (ids.length == 1) {
        await AdminApi.instance.softDelete(ids.first);
      } else {
        await AdminApi.instance.bulkDelete(ids);
      }
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Moved ${ids.length} to trash')),
      );
      _selected.clear();
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Delete failed: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<bool?> _showDeleteSheet(int count) {
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
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.amber.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.warning_amber_rounded, color: Colors.amber, size: 22),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text(
                      'Move to trash?',
                      style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                '$count user${count == 1 ? '' : 's'} will be moved to trash. Their email stays locked so they cannot re-register — until you purge from Trash.',
                style: const TextStyle(fontSize: 13.5, height: 1.5),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.of(context).pop(false),
                      child: const Padding(
                        padding: EdgeInsets.symmetric(vertical: 10),
                        child: Text('Cancel'),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: FilledButton(
                      style: FilledButton.styleFrom(backgroundColor: const Color(0xFFDC2626)),
                      onPressed: () => Navigator.of(context).pop(true),
                      child: const Padding(
                        padding: EdgeInsets.symmetric(vertical: 10),
                        child: Text('Move to trash'),
                      ),
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
        title: const Text('Manage users', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
        actions: [
          IconButton(
            tooltip: 'View trash',
            icon: const Icon(Icons.delete_outline),
            onPressed: () => context.push('/super-admin/trash'),
          ),
          const ThemeToggle(),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          // Role filter chips
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
                    setState(() { _tab = t.key; _page = 1; _selected.clear(); });
                    _load();
                  },
                );
              },
            ),
          ),
          // Search
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
            child: TextField(
              decoration: InputDecoration(
                prefixIcon: const Icon(Icons.search, size: 18),
                hintText: 'Search name or email…',
                filled: true,
                fillColor: surface,
                contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              ),
              onChanged: (v) {
                _search = v.trim();
                Future<void>.delayed(const Duration(milliseconds: 250), () {
                  if (mounted && v.trim() == _search) { setState(() { _page = 1; _selected.clear(); }); _load(); }
                });
              },
            ),
          ),

          // Bulk action bar
          if (_selected.isNotEmpty)
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFDC2626).withValues(alpha: 0.10),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFDC2626).withValues(alpha: 0.30)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      '${_selected.length} selected',
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFFB91C1C)),
                    ),
                  ),
                  TextButton(onPressed: () => setState(_selected.clear), child: const Text('Clear')),
                  const SizedBox(width: 4),
                  FilledButton.icon(
                    style: FilledButton.styleFrom(backgroundColor: const Color(0xFFDC2626)),
                    onPressed: _confirmAndDelete,
                    icon: const Icon(Icons.delete_outline, size: 15),
                    label: const Text('Trash'),
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
                    ? const Center(child: Text('No users match your filter.'))
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
                                      '${u.role.replaceAll('_', ' ')} · ${_dateStr(u.createdAt)}',
                                      style: TextStyle(fontSize: 11, color: isDark ? Colors.white54 : Colors.black54),
                                    ),
                                  ],
                                ),
                                secondary: IconButton(
                                  icon: const Icon(Icons.delete_outline, color: Color(0xFFDC2626), size: 20),
                                  onPressed: () async {
                                    setState(() { _selected..clear()..add(u.id); });
                                    await _confirmAndDelete();
                                  },
                                ),
                              ),
                            );
                          },
                        ),
                      ),
          ),

          // Pager
          if (_total > _pageSize)
            SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    IconButton(
                      onPressed: _page > 1 ? () { setState(() => _page--); _load(); } : null,
                      icon: const Icon(Icons.chevron_left),
                    ),
                    Text('Page $_page of ${(_total / _pageSize).ceil()}'),
                    IconButton(
                      onPressed: _page < (_total / _pageSize).ceil() ? () { setState(() => _page++); _load(); } : null,
                      icon: const Icon(Icons.chevron_right),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  static String _dateStr(String iso) {
    try {
      final d = DateTime.parse(iso);
      return '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
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
