import 'api_client.dart';

/// Mirror of web's lib/api/staff.ts — thin wrappers over
/// /super-admin/staff/* and /staff/* endpoints.

class ApiStaff {
  ApiStaff({
    required this.id,
    required this.name,
    required this.email,
    this.mobile,
    this.sharedPassword,
    this.deactivated = false,
    required this.createdAt,
    this.lastSeenAt,
  });
  final String id;
  final String name;
  final String email;
  final String? mobile;
  final String? sharedPassword;
  final bool deactivated;
  final String createdAt;
  final String? lastSeenAt;

  static ApiStaff fromJson(Map<String, dynamic> j) => ApiStaff(
        id: j['id'] as String,
        name: j['name'] as String,
        email: j['email'] as String,
        mobile: j['mobile'] as String?,
        sharedPassword: j['sharedPassword'] as String?,
        deactivated: (j['deactivated'] as bool?) ?? false,
        createdAt: j['createdAt'] as String,
        lastSeenAt: j['lastSeenAt'] as String?,
      );
}

class ApiEmployerRowForStaff {
  ApiEmployerRowForStaff({
    required this.id,
    required this.name,
    required this.email,
    this.mobile,
    this.sharedPassword,
    this.deactivated = false,
    this.createdByStaffId,
    required this.createdAt,
    this.company,
    required this.provisionedByMe,
  });
  final String id;
  final String name;
  final String email;
  final String? mobile;
  final String? sharedPassword;
  final bool deactivated;
  final String? createdByStaffId;
  final String createdAt;
  final String? company;
  final bool provisionedByMe;

  static ApiEmployerRowForStaff fromJson(Map<String, dynamic> j) => ApiEmployerRowForStaff(
        id: j['id'] as String,
        name: j['name'] as String,
        email: j['email'] as String,
        mobile: j['mobile'] as String?,
        sharedPassword: j['sharedPassword'] as String?,
        deactivated: (j['deactivated'] as bool?) ?? false,
        createdByStaffId: j['createdByStaffId'] as String?,
        createdAt: j['createdAt'] as String,
        company: j['company'] as String?,
        provisionedByMe: (j['provisionedByMe'] as bool?) ?? false,
      );
}

class SuperAdminStaffApi {
  SuperAdminStaffApi._();
  static final SuperAdminStaffApi instance = SuperAdminStaffApi._();
  final _c = ApiClient.instance;

  Future<List<ApiStaff>> list() async {
    final res = await _c.get<Map<String, dynamic>>('/super-admin/staff');
    return (res['items'] as List).cast<Map<String, dynamic>>().map(ApiStaff.fromJson).toList();
  }

  /// Create a staff account. Returns the fresh user + the plaintext
  /// password shown once so the super-admin can hand it off.
  Future<({ApiStaff user, String password})> create({
    required String name,
    required String email,
    String? mobile,
  }) async {
    final res = await _c.post<Map<String, dynamic>>('/super-admin/staff', {
      'name': name,
      'email': email,
      if (mobile != null) 'mobile': mobile,
    });
    return (
      user: ApiStaff.fromJson(res['user'] as Map<String, dynamic>),
      password: res['password'] as String,
    );
  }

  Future<({ApiStaff user, String password})> resetPassword(String id) async {
    final res = await _c.patch<Map<String, dynamic>>('/super-admin/staff/$id/reset-password');
    return (
      user: ApiStaff.fromJson(res['user'] as Map<String, dynamic>),
      password: res['password'] as String,
    );
  }

  Future<ApiStaff> setPassword(String id, String password) async {
    final res = await _c.patch<Map<String, dynamic>>('/super-admin/staff/$id/set-password', {
      'password': password,
    });
    return ApiStaff.fromJson(res['user'] as Map<String, dynamic>);
  }

  Future<ApiStaff> setDeactivated(String id, bool deactivated) async {
    final res = await _c.patch<Map<String, dynamic>>('/super-admin/staff/$id/deactivate', {
      'deactivated': deactivated,
    });
    return ApiStaff.fromJson(res['user'] as Map<String, dynamic>);
  }
}

class StaffApi {
  StaffApi._();
  static final StaffApi instance = StaffApi._();
  final _c = ApiClient.instance;

  Future<List<ApiEmployerRowForStaff>> listEmployers() async {
    final res = await _c.get<Map<String, dynamic>>('/staff/employers');
    return (res['items'] as List).cast<Map<String, dynamic>>().map(ApiEmployerRowForStaff.fromJson).toList();
  }

  Future<({ApiEmployerRowForStaff user, String password})> createEmployer({
    required String name,
    required String email,
    String? mobile,
    String? company,
  }) async {
    final res = await _c.post<Map<String, dynamic>>('/staff/employers', {
      'name': name,
      'email': email,
      if (mobile != null) 'mobile': mobile,
      if (company != null) 'company': company,
    });
    return (
      user: ApiEmployerRowForStaff.fromJson(res['user'] as Map<String, dynamic>),
      password: res['password'] as String,
    );
  }

  Future<ApiEmployerRowForStaff> updateEmployer(
    String id, {
    String? name,
    String? mobile,
    String? company,
  }) async {
    final res = await _c.patch<Map<String, dynamic>>('/staff/employers/$id', {
      if (name != null) 'name': name,
      if (mobile != null) 'mobile': mobile,
      if (company != null) 'company': company,
    });
    return ApiEmployerRowForStaff.fromJson(res['user'] as Map<String, dynamic>);
  }

  Future<({ApiEmployerRowForStaff user, String password})> resetEmployerPassword(String id) async {
    final res = await _c.patch<Map<String, dynamic>>('/staff/employers/$id/reset-password');
    return (
      user: ApiEmployerRowForStaff.fromJson(res['user'] as Map<String, dynamic>),
      password: res['password'] as String,
    );
  }

  /// Post a job on behalf of an employer. `employerId` travels in
  /// the body (not derived from the JWT — the JWT belongs to staff).
  Future<Map<String, dynamic>> createJob(Map<String, dynamic> input) async {
    final res = await _c.post<Map<String, dynamic>>('/staff/jobs', input);
    return res['job'] as Map<String, dynamic>;
  }

  /// Jobs THIS staff user posted, across every employer.
  Future<List<Map<String, dynamic>>> listJobs() async {
    final res = await _c.get<Map<String, dynamic>>('/staff/jobs');
    return (res['items'] as List).cast<Map<String, dynamic>>();
  }
}
