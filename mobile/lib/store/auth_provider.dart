import 'dart:convert';
import 'dart:math' as math;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/foundation.dart';
import '../storage/storage.dart';

/// Application roles. `staff` (2026-07) is an internal ops lane that mints
/// employer accounts + posts jobs on their behalf. Kept siloed from
/// `employer`/`admin` — hasRole() gives no cross-role grants.
enum Role { candidate, employer, admin, superAdmin, staff }

@immutable
class User {
  const User({
    required this.id,
    required this.role,
    required this.name,
    required this.email,
    this.mobile,
    this.company,
    required this.emailVerified,
    required this.createdAt,
    this.sharedPassword,
    this.createdByStaffId,
    this.deactivated = false,
    this.hasPassword = false,
  });

  final String id;
  final Role role;
  final String name;
  final String email;
  final String? mobile;
  final String? company;
  final bool emailVerified;
  final String createdAt;

  /// Only populated on users provisioned by staff (employer users) or by
  /// super-admin (staff users). Holds the plaintext password we generated
  /// so it can be re-shown from the Employer Master row until real email
  /// is wired.
  ///
  /// SECURITY: dev-only stopgap. Once the email pipeline lands, we email
  /// the credential once and drop this field. Self-registered users never
  /// carry a value here.
  final String? sharedPassword;

  /// The staff user who created this employer (when applicable).
  final String? createdByStaffId;

  /// Soft-deactivate flag — flipped from super-admin's staff manager.
  /// A deactivated user can't `passwordLogin` and their live session is
  /// dropped the moment the flag flips.
  final bool deactivated;

  /// Server-derived from `!!passwordHash`. Drives the "set a password"
  /// prompt after OTP verify + the "set" vs "change" mode on the
  /// account settings page. Defaults to false when the API hasn't
  /// populated it yet (fresh signup, offline cache).
  final bool hasPassword;

  Map<String, dynamic> toJson() => {
        'id': id,
        'role': _roleToString(role),
        'name': name,
        'email': email,
        'mobile': mobile,
        if (company != null) 'company': company,
        'emailVerified': emailVerified,
        'createdAt': createdAt,
        if (sharedPassword != null) 'sharedPassword': sharedPassword,
        if (createdByStaffId != null) 'createdByStaffId': createdByStaffId,
        if (deactivated) 'deactivated': deactivated,
        if (hasPassword) 'hasPassword': hasPassword,
      };

  static User fromJson(Map<String, dynamic> j) => User(
        id: j['id'] as String,
        role: _roleFromString(j['role'] as String),
        name: j['name'] as String,
        email: j['email'] as String,
        mobile: j['mobile'] as String?,
        company: j['company'] as String?,
        emailVerified: j['emailVerified'] as bool,
        createdAt: j['createdAt'] as String,
        sharedPassword: j['sharedPassword'] as String?,
        createdByStaffId: j['createdByStaffId'] as String?,
        deactivated: (j['deactivated'] as bool?) ?? false,
        hasPassword: (j['hasPassword'] as bool?) ?? false,
      );

  User copyWith({
    bool? emailVerified,
    String? name,
    String? mobile,
    String? company,
    String? sharedPassword,
    bool? deactivated,
    bool? hasPassword,
  }) =>
      User(
        id: id,
        role: role,
        name: name ?? this.name,
        email: email,
        mobile: mobile ?? this.mobile,
        company: company ?? this.company,
        emailVerified: emailVerified ?? this.emailVerified,
        createdAt: createdAt,
        sharedPassword: sharedPassword ?? this.sharedPassword,
        createdByStaffId: createdByStaffId,
        deactivated: deactivated ?? this.deactivated,
        hasPassword: hasPassword ?? this.hasPassword,
      );
}

String _roleToString(Role r) {
  switch (r) {
    case Role.candidate:
      return 'candidate';
    case Role.employer:
      return 'employer';
    case Role.admin:
      return 'admin';
    case Role.superAdmin:
      return 'super_admin';
    case Role.staff:
      return 'staff';
  }
}

Role _roleFromString(String s) {
  switch (s) {
    case 'candidate':
      return Role.candidate;
    case 'employer':
      return Role.employer;
    case 'admin':
      return Role.admin;
    case 'super_admin':
      return Role.superAdmin;
    case 'staff':
      return Role.staff;
    default:
      return Role.candidate;
  }
}

/// 10-character generated password — one upper, one lower, one digit
/// guaranteed, plus 7 random from all classes. Confusable characters
/// (I/O/1/0) are omitted so it types cleanly over the phone.
String _generatePassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  final all = '$upper$lower$digits';
  final r = math.Random.secure();
  String pick(String pool) => pool[r.nextInt(pool.length)];
  final chars = <String>[pick(upper), pick(lower), pick(digits)];
  while (chars.length < 10) {
    chars.add(pick(all));
  }
  chars.shuffle(r);
  return chars.join();
}

class AuthNotifier extends Notifier<User?> {
  @override
  User? build() {
    final raw = Storage.instance.getString(StorageKeys.currentUser);
    if (raw == null) return null;
    return User.fromJson(jsonDecode(raw) as Map<String, dynamic>);
  }

  List<User> _loadUsers() {
    final raw = Storage.instance.getString(StorageKeys.users);
    if (raw == null) return [];
    final list = jsonDecode(raw) as List<dynamic>;
    return list
        .map((e) => User.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  void _saveUsers(List<User> users) {
    Storage.instance.setString(
      StorageKeys.users,
      jsonEncode(users.map((u) => u.toJson()).toList()),
    );
  }

  void _setCurrent(User user) {
    Storage.instance.setString(
      StorageKeys.currentUser,
      jsonEncode(user.toJson()),
    );
    state = user;
  }

  User? findByEmail(String email) {
    final norm = email.toLowerCase();
    for (final u in _loadUsers()) {
      if (u.email.toLowerCase() == norm) return u;
    }
    return null;
  }

  User register({
    required Role role,
    required String name,
    required String email,
    String? mobile,
    String? company,
  }) {
    final users = _loadUsers();
    final existing = users.where(
      (u) => u.email.toLowerCase() == email.toLowerCase(),
    );
    if (existing.isNotEmpty) return existing.first;

    final user = User(
      id: 'u_${DateTime.now().microsecondsSinceEpoch.toRadixString(36)}',
      role: role,
      name: name,
      email: email,
      mobile: mobile,
      company: company,
      emailVerified: false,
      createdAt: DateTime.now().toIso8601String(),
    );
    _saveUsers([user, ...users]);
    return user;
  }

  /// All registered users (helper for admin/employer/staff-y views).
  List<User> allUsers() => _loadUsers();

  void markVerified(String email) {
    final norm = email.toLowerCase();
    final users = _loadUsers();
    final updated = users
        .map((u) => u.email.toLowerCase() == norm
            ? u.copyWith(emailVerified: true)
            : u)
        .toList();
    _saveUsers(updated);
    final me = updated.where((u) => u.email.toLowerCase() == norm);
    if (me.isNotEmpty) {
      _setCurrent(me.first);
    }
  }

  User? loginByEmail(String email) {
    final user = findByEmail(email);
    if (user == null) return null;
    _setCurrent(user);
    return user;
  }

  void logout() {
    Storage.instance.remove(StorageKeys.currentUser);
    state = null;
  }

  // ---------------- Staff + Employer Master (2026-07) ----------------

  /// Password-based sign-in. Used by staff (their primary auth path) and
  /// by employers whose accounts were provisioned by staff (fallback when
  /// they can't receive an OTP because email isn't wired yet).
  /// Returns the matched user or null. Marks the user verified on
  /// success so downstream role guards don't trip.
  User? passwordLogin(String email, String password) {
    final norm = email.toLowerCase();
    final users = _loadUsers();
    final matches = users.where(
      (u) =>
          u.email.toLowerCase() == norm &&
          u.sharedPassword != null &&
          u.sharedPassword == password,
    );
    if (matches.isEmpty) return null;
    final match = matches.first;
    if (match.deactivated) return null;
    final verified = match.copyWith(emailVerified: true);
    _saveUsers(users.map((u) => u.id == match.id ? verified : u).toList());
    _setCurrent(verified);
    return verified;
  }

  /// Super-admin creates a staff account. Password is generated + returned
  /// so the caller can pop the credential-share sheet.
  ({User user, String password}) createStaff({
    required String name,
    required String email,
    String? mobile,
  }) {
    final users = _loadUsers();
    final existing = users
        .where((u) => u.email.toLowerCase() == email.toLowerCase())
        .toList();
    final password = _generatePassword();
    if (existing.isNotEmpty) {
      // Idempotent — re-issue a fresh password for the existing row and
      // promote it to `staff` so a mistyped invite doesn't create a dupe.
      final promoted = User(
        id: existing.first.id,
        role: Role.staff,
        name: existing.first.name,
        email: existing.first.email,
        mobile: existing.first.mobile ?? mobile,
        company: existing.first.company,
        emailVerified: true,
        createdAt: existing.first.createdAt,
        sharedPassword: password,
        deactivated: false,
      );
      _saveUsers(users.map((u) => u.id == promoted.id ? promoted : u).toList());
      return (user: promoted, password: password);
    }
    final user = User(
      id: 'u_${DateTime.now().microsecondsSinceEpoch.toRadixString(36)}',
      role: Role.staff,
      name: name,
      email: email,
      mobile: mobile,
      emailVerified: true,
      createdAt: DateTime.now().toIso8601String(),
      sharedPassword: password,
    );
    _saveUsers([user, ...users]);
    return (user: user, password: password);
  }

  /// Staff creates an employer in the Employer Master. Duplicate email is
  /// a hard error — the caller should show a proper message so staff can
  /// pick the existing row instead of silently clobbering it.
  ({User user, String password}) createEmployerByStaff({
    required String staffId,
    required String name,
    required String email,
    String? mobile,
    String? company,
  }) {
    final users = _loadUsers();
    if (users.any((u) => u.email.toLowerCase() == email.toLowerCase())) {
      throw StateError('EMAIL_TAKEN');
    }
    final password = _generatePassword();
    final user = User(
      id: 'u_${DateTime.now().microsecondsSinceEpoch.toRadixString(36)}',
      role: Role.employer,
      name: name,
      email: email,
      mobile: mobile,
      company: company,
      emailVerified: true,
      createdAt: DateTime.now().toIso8601String(),
      sharedPassword: password,
      createdByStaffId: staffId,
    );
    _saveUsers([user, ...users]);
    return (user: user, password: password);
  }

  /// Overwrite any shared-password user's credential (staff OR employer)
  /// with a freshly-generated one. Returns the new plaintext so the
  /// caller can hand it off via CredentialShareSheet. Also keeps the
  /// current session in sync if the target is the signed-in user.
  ///
  /// The role check is intentionally loose — an id belonging to a user
  /// without a `sharedPassword` still gets one on reset, which is the
  /// right behaviour if a self-registered employer ever needs to be
  /// given a shared credential.
  String resetSharedPassword(String userId) {
    final users = _loadUsers();
    final target = users.where((u) => u.id == userId).toList();
    if (target.isEmpty) throw StateError('NOT_FOUND');
    final password = _generatePassword();
    final next = target.first.copyWith(sharedPassword: password);
    _saveUsers(users.map((u) => u.id == userId ? next : u).toList());
    if (state?.id == userId) _setCurrent(next);
    return password;
  }

  /// @deprecated Prefer [resetSharedPassword]. Kept as a thin alias so
  /// the staff-facing employer flows don't need to churn.
  String resetEmployerPassword(String employerId) => resetSharedPassword(employerId);

  /// Set an explicit password on any user — used by the super-admin's
  /// "Change password" flow so they can pick a memorable string instead
  /// of accepting the generated one. Same session-sync behaviour as
  /// [resetSharedPassword].
  ///
  /// The caller is responsible for validating (length, complexity) — the
  /// store just persists whatever it's given.
  void setSharedPassword(String userId, String password) {
    final users = _loadUsers();
    final target = users.where((u) => u.id == userId).toList();
    if (target.isEmpty) throw StateError('NOT_FOUND');
    final next = target.first.copyWith(sharedPassword: password);
    _saveUsers(users.map((u) => u.id == userId ? next : u).toList());
    if (state?.id == userId) _setCurrent(next);
  }

  /// Patch limited fields on an existing employer (staff-owned edit).
  void updateEmployer(
    String employerId, {
    String? name,
    String? mobile,
    String? company,
  }) {
    final users = _loadUsers();
    final target = users.where((u) => u.id == employerId).toList();
    if (target.isEmpty) return;
    final next = target.first.copyWith(
      name: name,
      mobile: mobile,
      company: company,
    );
    _saveUsers(users.map((u) => u.id == employerId ? next : u).toList());
    if (state?.id == employerId) _setCurrent(next);
  }

  /// Toggle the `deactivated` flag. Deactivating the currently-signed-in
  /// user drops their session immediately so their next screen bounces
  /// to the appropriate login.
  void setDeactivated(String id, bool deactivated) {
    final users = _loadUsers();
    final updated = users
        .map((u) => u.id == id ? u.copyWith(deactivated: deactivated) : u)
        .toList();
    _saveUsers(updated);
    if (deactivated && state?.id == id) {
      Storage.instance.remove(StorageKeys.currentUser);
      state = null;
    }
  }
}

final authProvider = NotifierProvider<AuthNotifier, User?>(AuthNotifier.new);
