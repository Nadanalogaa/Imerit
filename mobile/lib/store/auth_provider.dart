import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/foundation.dart';
import '../storage/storage.dart';

enum Role { candidate, employer, admin, superAdmin }

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
  });

  final String id;
  final Role role;
  final String name;
  final String email;
  final String? mobile;
  final String? company;
  final bool emailVerified;
  final String createdAt;

  Map<String, dynamic> toJson() => {
        'id': id,
        'role': _roleToString(role),
        'name': name,
        'email': email,
        'mobile': mobile,
        if (company != null) 'company': company,
        'emailVerified': emailVerified,
        'createdAt': createdAt,
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
      );

  User copyWith({bool? emailVerified}) => User(
        id: id,
        role: role,
        name: name,
        email: email,
        mobile: mobile,
        company: company,
        emailVerified: emailVerified ?? this.emailVerified,
        createdAt: createdAt,
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
    default:
      return Role.candidate;
  }
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

  /// All registered users (helper for admin/employer-y views).
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
      final user = me.first;
      Storage.instance.setString(
        StorageKeys.currentUser,
        jsonEncode(user.toJson()),
      );
      state = user;
    }
  }

  User? loginByEmail(String email) {
    final user = findByEmail(email);
    if (user == null) return null;
    Storage.instance.setString(
      StorageKeys.currentUser,
      jsonEncode(user.toJson()),
    );
    state = user;
    return user;
  }

  void logout() {
    Storage.instance.remove(StorageKeys.currentUser);
    state = null;
  }
}

final authProvider = NotifierProvider<AuthNotifier, User?>(AuthNotifier.new);
