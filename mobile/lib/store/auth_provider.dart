import 'dart:convert';
import 'dart:math' as math;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/foundation.dart';
import '../storage/storage.dart';
import '../api/api_client.dart';
import '../api/auth_api.dart';
import '../api/staff_api.dart';

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

/// Fold an ApiUser (raw wire shape) into the mobile User model.
User _fromApiUser(ApiUser a) => User(
      id: a.id,
      role: _roleFromString(a.role.toLowerCase()),
      name: a.name,
      email: a.email,
      mobile: a.mobile,
      emailVerified: a.emailVerified,
      createdAt: a.createdAt,
      hasPassword: a.hasPassword,
    );

/// Fold an ApiStaff row into the mobile User model. Preserves the
/// server-side sharedPassword + deactivated flags so the staff master
/// UI can reveal-and-copy.
User _fromApiStaff(ApiStaff s) => User(
      id: s.id,
      role: Role.staff,
      name: s.name,
      email: s.email,
      mobile: s.mobile,
      emailVerified: true,
      createdAt: s.createdAt,
      sharedPassword: s.sharedPassword,
      deactivated: s.deactivated,
    );

/// Fold an ApiEmployerRowForStaff into the mobile User model.
User _fromApiEmployerRow(ApiEmployerRowForStaff e) => User(
      id: e.id,
      role: Role.employer,
      name: e.name,
      email: e.email,
      mobile: e.mobile,
      company: e.company,
      emailVerified: true,
      createdAt: e.createdAt,
      sharedPassword: e.sharedPassword,
      createdByStaffId: e.createdByStaffId,
      deactivated: e.deactivated,
    );

/// 10-character generated password — one upper, one lower, one digit
/// guaranteed, plus 7 random from all classes. Confusable characters
/// (I/O/1/0) are omitted so it types cleanly over the phone.
/// Only used in offline (apiEnabled=false) mode; the server generates
/// passwords when we're online.
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

  Future<void> logout() async {
    if (apiEnabled) {
      try { await AuthApi.instance.logout(); } catch (_) { /* clear locally regardless */ }
    }
    Storage.instance.remove(StorageKeys.currentUser);
    state = null;
  }

  /// Hydrate the current-user cache from the server on app boot when
  /// there's a valid auth cookie in the jar. Silently no-ops for
  /// offline mode or when the cookie is missing/expired.
  Future<void> hydrateFromServer() async {
    if (!apiEnabled) return;
    try {
      final api = await AuthApi.instance.me();
      _setCurrent(_fromApiUser(api));
    } on ApiError catch (e) {
      if (e.status == 401) {
        // No live session — drop any stale local user so RequireAuth
        // guards bounce cleanly to the login page.
        Storage.instance.remove(StorageKeys.currentUser);
        state = null;
      }
      // Any other error → leave the cached user in place so offline
      // usage keeps working.
    } catch (_) {
      // Network hiccup — same story, don't clobber the cache.
    }
  }

  /// Merge a user row into the local `users` cache. Used by every
  /// staff/employer mutation that returns the fresh row from the
  /// server so allUsers() reads stay hot.
  void _upsertLocal(User u) {
    final users = _loadUsers();
    final idx = users.indexWhere((x) => x.id == u.id);
    if (idx == -1) {
      _saveUsers([u, ...users]);
    } else {
      _saveUsers(users.map((x) => x.id == u.id ? u : x).toList());
    }
  }

  // ---------------- Staff + Employer Master (2026-07) ----------------

  /// Password-based sign-in. Used by staff, staff-provisioned employers,
  /// AND any user (candidate/employer) who's opted into a password via
  /// /set-password after their first OTP session.
  ///
  /// Hits POST /auth/password/login when apiEnabled. Falls back to a
  /// localStorage lookup in offline mode so dev + demo builds still
  /// work without the backend.
  ///
  /// Throws ApiError on bad creds / deactivated account. Returns the
  /// signed-in user on success (also updates `state`).
  Future<User> passwordLogin(String email, String password) async {
    if (apiEnabled) {
      final res = await AuthApi.instance.passwordLogin(email, password);
      final u = _fromApiUser(res.user);
      _setCurrent(u);
      _upsertLocal(u);
      return u;
    }
    final norm = email.toLowerCase();
    final users = _loadUsers();
    final matches = users.where(
      (u) =>
          u.email.toLowerCase() == norm &&
          u.sharedPassword != null &&
          u.sharedPassword == password,
    );
    if (matches.isEmpty) {
      throw ApiError(status: 401, code: 'AUTH_INVALID', message: 'Incorrect email or password');
    }
    final match = matches.first;
    if (match.deactivated) {
      throw ApiError(status: 403, code: 'ACCOUNT_DEACTIVATED', message: 'Account is deactivated');
    }
    final verified = match.copyWith(emailVerified: true);
    _saveUsers(users.map((u) => u.id == match.id ? verified : u).toList());
    _setCurrent(verified);
    return verified;
  }

  /// Super-admin creates a staff account. Server hashes for auth and
  /// stores plaintext for the reveal/copy UX super-admin needs when
  /// handing creds off.
  Future<({User user, String password})> createStaff({
    required String name,
    required String email,
    String? mobile,
  }) async {
    if (apiEnabled) {
      final res = await SuperAdminStaffApi.instance.create(name: name, email: email, mobile: mobile);
      final u = _fromApiStaff(res.user).copyWith(sharedPassword: res.password);
      _upsertLocal(u);
      return (user: u, password: res.password);
    }
    final users = _loadUsers();
    final existing = users
        .where((u) => u.email.toLowerCase() == email.toLowerCase())
        .toList();
    final password = _generatePassword();
    if (existing.isNotEmpty) {
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

  /// Staff creates an employer. Server hashes the password AND stores
  /// plaintext so staff can reveal it later from the Employer Master.
  /// EmployerProfile with the company name is created in the same
  /// transaction backend-side.
  Future<({User user, String password})> createEmployerByStaff({
    required String staffId,
    required String name,
    required String email,
    String? mobile,
    String? company,
  }) async {
    if (apiEnabled) {
      final res = await StaffApi.instance.createEmployer(name: name, email: email, mobile: mobile, company: company);
      final u = _fromApiEmployerRow(res.user).copyWith(sharedPassword: res.password);
      _upsertLocal(u);
      return (user: u, password: res.password);
    }
    final users = _loadUsers();
    if (users.any((u) => u.email.toLowerCase() == email.toLowerCase())) {
      throw ApiError(status: 409, code: 'EMAIL_TAKEN', message: 'An account already exists for that email');
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

  /// Regenerate a fresh random password for a staff or employer
  /// account. Returns the plaintext so the caller can pop the share
  /// sheet. Server picks the right endpoint based on the target's
  /// role (checked via the local cache).
  Future<String> resetSharedPassword(String userId) async {
    if (apiEnabled) {
      // Look at the local cache to guess role. Fall back to the staff
      // endpoint if unknown — matches web behaviour.
      final users = _loadUsers();
      final target = users.where((u) => u.id == userId).toList();
      if (target.isNotEmpty && target.first.role == Role.employer) {
        final res = await StaffApi.instance.resetEmployerPassword(userId);
        _upsertLocal(_fromApiEmployerRow(res.user).copyWith(sharedPassword: res.password));
        return res.password;
      }
      final res = await SuperAdminStaffApi.instance.resetPassword(userId);
      _upsertLocal(_fromApiStaff(res.user).copyWith(sharedPassword: res.password));
      return res.password;
    }
    final users = _loadUsers();
    final target = users.where((u) => u.id == userId).toList();
    if (target.isEmpty) throw ApiError(status: 404, code: 'NOT_FOUND', message: 'Account not found');
    final password = _generatePassword();
    final next = target.first.copyWith(sharedPassword: password);
    _saveUsers(users.map((u) => u.id == userId ? next : u).toList());
    if (state?.id == userId) _setCurrent(next);
    return password;
  }

  /// Alias — staff-facing flows still call resetEmployerPassword.
  Future<String> resetEmployerPassword(String employerId) => resetSharedPassword(employerId);

  /// Super-admin sets an explicit staff password (bypasses random
  /// gen). Server-side only supported for staff.
  Future<void> setSharedPassword(String userId, String password) async {
    if (apiEnabled) {
      final u = await SuperAdminStaffApi.instance.setPassword(userId, password);
      _upsertLocal(_fromApiStaff(u).copyWith(sharedPassword: password));
      return;
    }
    final users = _loadUsers();
    final target = users.where((u) => u.id == userId).toList();
    if (target.isEmpty) throw ApiError(status: 404, code: 'NOT_FOUND', message: 'Account not found');
    final next = target.first.copyWith(sharedPassword: password);
    _saveUsers(users.map((u) => u.id == userId ? next : u).toList());
    if (state?.id == userId) _setCurrent(next);
  }

  /// Patch limited fields on an employer staff has provisioned.
  Future<void> updateEmployer(
    String employerId, {
    String? name,
    String? mobile,
    String? company,
  }) async {
    if (apiEnabled) {
      final u = await StaffApi.instance.updateEmployer(employerId, name: name, mobile: mobile, company: company);
      _upsertLocal(_fromApiEmployerRow(u));
      if (state?.id == employerId) _setCurrent(_fromApiEmployerRow(u));
      return;
    }
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
  Future<void> setDeactivated(String id, bool deactivated) async {
    if (apiEnabled) {
      final u = await SuperAdminStaffApi.instance.setDeactivated(id, deactivated);
      _upsertLocal(_fromApiStaff(u));
    } else {
      final users = _loadUsers();
      final updated = users
          .map((u) => u.id == id ? u.copyWith(deactivated: deactivated) : u)
          .toList();
      _saveUsers(updated);
    }
    if (deactivated && state?.id == id) {
      Storage.instance.remove(StorageKeys.currentUser);
      state = null;
    }
  }

  /// Load fresh staff list from the server, merge into local cache
  /// so the SuperAdminStaffPage list stays in sync cross-device.
  Future<List<User>> fetchAllStaff() async {
    if (!apiEnabled) {
      return _loadUsers().where((u) => u.role == Role.staff).toList();
    }
    final rows = await SuperAdminStaffApi.instance.list();
    final users = rows.map(_fromApiStaff).toList();
    for (final u in users) { _upsertLocal(u); }
    return users;
  }

  /// Load employer master from the server for staff — every employer
  /// on the platform + provisionedByMe flag.
  Future<List<User>> fetchEmployersForStaff() async {
    if (!apiEnabled) {
      return _loadUsers().where((u) => u.role == Role.employer).toList();
    }
    final rows = await StaffApi.instance.listEmployers();
    final users = rows.map(_fromApiEmployerRow).toList();
    for (final u in users) { _upsertLocal(u); }
    return users;
  }
}

final authProvider = NotifierProvider<AuthNotifier, User?>(AuthNotifier.new);
