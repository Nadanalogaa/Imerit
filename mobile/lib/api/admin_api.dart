import 'api_client.dart';

/// Mirror of web's lib/api/admin.ts — admin list + super-admin trash.

class AdminUserItem {
  AdminUserItem({
    required this.id,
    required this.role,
    required this.name,
    required this.email,
    this.mobile,
    required this.emailVerified,
    required this.createdAt,
    this.companyName,
  });
  final String id;
  final String role;
  final String name;
  final String email;
  final String? mobile;
  final bool emailVerified;
  final String createdAt;
  final String? companyName;

  static AdminUserItem fromJson(Map<String, dynamic> j) => AdminUserItem(
        id: j['id'] as String,
        role: j['role'] as String,
        name: j['name'] as String,
        email: j['email'] as String,
        mobile: j['mobile'] as String?,
        emailVerified: (j['emailVerified'] as bool?) ?? false,
        createdAt: j['createdAt'] as String,
        companyName: (j['employerProfile']?['companyName']) as String?,
      );
}

class TrashUser extends AdminUserItem {
  TrashUser({
    required super.id,
    required super.role,
    required super.name,
    required super.email,
    super.mobile,
    required super.emailVerified,
    required super.createdAt,
    super.companyName,
    required this.deletedAt,
  });
  final String deletedAt;

  static TrashUser fromJson(Map<String, dynamic> j) => TrashUser(
        id: j['id'] as String,
        role: j['role'] as String,
        name: j['name'] as String,
        email: j['email'] as String,
        mobile: j['mobile'] as String?,
        emailVerified: (j['emailVerified'] as bool?) ?? false,
        createdAt: j['createdAt'] as String,
        companyName: (j['employerProfile']?['companyName']) as String?,
        deletedAt: j['deletedAt'] as String,
      );
}

class AdminUsersPage {
  AdminUsersPage({required this.items, required this.total, required this.page, required this.pageSize});
  final List<AdminUserItem> items;
  final int total;
  final int page;
  final int pageSize;
}

class BulkResult {
  BulkResult({required this.total, required this.succeeded, required this.failed});
  final int total;
  final int succeeded;
  final int failed;
  static BulkResult fromJson(Map<String, dynamic> j) => BulkResult(
        total: j['total'] as int,
        succeeded: j['succeeded'] as int,
        failed: j['failed'] as int,
      );
}

class AdminApi {
  AdminApi._();
  static final AdminApi instance = AdminApi._();
  final _c = ApiClient.instance;

  Future<AdminUsersPage> listUsers({
    String? role,
    String? search,
    int page = 1,
    int pageSize = 25,
  }) async {
    final qs = <String, String>{
      'page': '$page',
      'pageSize': '$pageSize',
    };
    if (role != null) qs['role'] = role;
    if (search != null && search.isNotEmpty) qs['search'] = search;
    final query = qs.entries.map((e) => '${e.key}=${Uri.encodeQueryComponent(e.value)}').join('&');
    final res = await _c.get<Map<String, dynamic>>('/admin/users?$query');
    return AdminUsersPage(
      items: (res['items'] as List)
          .cast<Map<String, dynamic>>()
          .map(AdminUserItem.fromJson)
          .toList(),
      total: res['total'] as int,
      page: res['page'] as int,
      pageSize: res['pageSize'] as int,
    );
  }

  Future<List<TrashUser>> listTrash({String? role}) async {
    final query = role != null ? '?role=$role' : '';
    final res = await _c.get<Map<String, dynamic>>('/super-admin/trash$query');
    return (res['items'] as List)
        .cast<Map<String, dynamic>>()
        .map(TrashUser.fromJson)
        .toList();
  }

  Future<void> softDelete(String id) async {
    await _c.delete<Map<String, dynamic>>('/super-admin/users/$id');
  }

  Future<BulkResult> bulkDelete(List<String> ids) async {
    final res = await _c.post<Map<String, dynamic>>('/super-admin/users/bulk-delete', {'ids': ids});
    return BulkResult.fromJson(res);
  }

  Future<void> restore(String id) async {
    await _c.post<Map<String, dynamic>>('/super-admin/users/$id/restore', const {});
  }

  Future<BulkResult> bulkRestore(List<String> ids) async {
    final res = await _c.post<Map<String, dynamic>>('/super-admin/users/bulk-restore', {'ids': ids});
    return BulkResult.fromJson(res);
  }

  Future<void> purge(String id) async {
    await _c.delete<Map<String, dynamic>>('/super-admin/users/$id/permanent');
  }

  Future<BulkResult> bulkPurge(List<String> ids) async {
    final res = await _c.post<Map<String, dynamic>>('/super-admin/users/bulk-purge', {'ids': ids});
    return BulkResult.fromJson(res);
  }

  Future<BulkResult> emptyTrash() async {
    final res = await _c.post<Map<String, dynamic>>('/super-admin/trash/empty', const {});
    return BulkResult.fromJson(res);
  }
}
