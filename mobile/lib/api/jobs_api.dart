import 'api_client.dart';

/// Thin wrapper over /jobs (public browse), /employer/jobs (create),
/// /staff/jobs (create-on-behalf), /jobs/:id/apply (candidate apply).
///
/// Kept minimal — the mobile Job model already knows how to
/// deserialise the API's row shape from JSON, so this file just
/// hands raw JSON around.

class JobsApi {
  JobsApi._();
  static final JobsApi instance = JobsApi._();
  final _c = ApiClient.instance;

  /// Public browse — no auth required. Returns { items, total, page,
  /// pageSize }. Filters (field/type/experience/districtId/search)
  /// pass as query params.
  Future<Map<String, dynamic>> browse({
    String? field,
    String? type,
    String? experience,
    String? districtId,
    String? search,
    int page = 1,
    int pageSize = 20,
  }) async {
    final q = <String, String>{
      'page': '$page',
      'pageSize': '$pageSize',
      if (field != null) 'field': field,
      if (type != null) 'type': type,
      if (experience != null) 'experience': experience,
      if (districtId != null) 'districtId': districtId,
      if (search != null && search.isNotEmpty) 'search': search,
    };
    final query = q.entries.map((e) => '${Uri.encodeQueryComponent(e.key)}=${Uri.encodeQueryComponent(e.value)}').join('&');
    return _c.get<Map<String, dynamic>>('/jobs?$query');
  }

  /// Single job by id — public.
  Future<Map<String, dynamic>> get(String id) async {
    final res = await _c.get<Map<String, dynamic>>('/jobs/$id');
    return res['job'] as Map<String, dynamic>;
  }

  /// Employer's own posted jobs.
  Future<List<Map<String, dynamic>>> employerList() async {
    final res = await _c.get<Map<String, dynamic>>('/employer/jobs');
    return (res['items'] as List).cast<Map<String, dynamic>>();
  }

  /// POST /employer/jobs — signed-in employer creates their own job.
  Future<Map<String, dynamic>> employerCreate(Map<String, dynamic> input) async {
    final res = await _c.post<Map<String, dynamic>>('/employer/jobs', input);
    return res['job'] as Map<String, dynamic>;
  }

  /// PATCH /employer/jobs/:id — signed-in employer edits their own job.
  Future<Map<String, dynamic>> employerUpdate(String id, Map<String, dynamic> patch) async {
    final res = await _c.patch<Map<String, dynamic>>('/employer/jobs/$id', patch);
    return res['job'] as Map<String, dynamic>;
  }

  /// POST /employer/jobs/:id/repost — bumps expiry.
  Future<Map<String, dynamic>> employerRepost(String id) async {
    final res = await _c.post<Map<String, dynamic>>('/employer/jobs/$id/repost');
    return res['job'] as Map<String, dynamic>;
  }

  /// DELETE /employer/jobs/:id — soft-delete.
  Future<void> employerDelete(String id) => _c.delete<Map<String, dynamic>>('/employer/jobs/$id');

  /// POST /jobs/:id/apply — candidate applies. Optional coverNote.
  Future<Map<String, dynamic>> apply(String jobId, {int? matchScore, String? coverNote}) async {
    final res = await _c.post<Map<String, dynamic>>('/jobs/$jobId/apply', {
      if (matchScore != null) 'matchScore': matchScore,
      if (coverNote != null) 'coverNote': coverNote,
    });
    return res['application'] as Map<String, dynamic>;
  }

  /// Candidate's own applications with the joined job.
  Future<List<Map<String, dynamic>>> myApplications() async {
    final res = await _c.get<Map<String, dynamic>>('/candidate/applications');
    return (res['items'] as List).cast<Map<String, dynamic>>();
  }
}
