import 'auth_provider.dart';

const _adminCreds = {
  'admin@itr.com': ('admin123', Role.admin, 'Platform Admin'),
  'super@itr.com': ('super123', Role.superAdmin, 'Super Admin'),
};

/// Verify hardcoded admin credentials, returning the role on success.
/// Caller should then either register or log in via auth provider.
({Role role, String name})? checkAdmin(String email, String password) {
  final creds = _adminCreds[email.toLowerCase()];
  if (creds == null) return null;
  if (creds.$1 != password) return null;
  return (role: creds.$2, name: creds.$3);
}

List<({String email, String password, Role role})> demoCreds() => _adminCreds.entries
    .map((e) => (email: e.key, password: e.value.$1, role: e.value.$2))
    .toList();
