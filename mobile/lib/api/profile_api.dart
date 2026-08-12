import 'api_client.dart';

/// Wrapper over the candidate + employer profile endpoints. Mirrors
/// `web/src/lib/api/profile.ts`. Paths follow the backend router in
/// `backend/src/routes/profile.routes.ts` (`/candidate/profile*` for
/// the caller's own row, `/profiles/:userId` for someone else's).
class ProfileApi {
  ProfileApi._();
  static final ProfileApi instance = ProfileApi._();
  final _c = ApiClient.instance;

  /// Own candidate profile — server returns { profile }.
  Future<Map<String, dynamic>> getMine() async {
    final res = await _c.get<Map<String, dynamic>>('/candidate/profile');
    return res;
  }

  /// Someone else's profile by userId (employer + admin views).
  /// Backend returns 404 for unapproved profiles when caller is a
  /// non-admin, non-owner viewer (curated-marketplace visibility).
  Future<Map<String, dynamic>> getByUserId(String userId) async {
    final res = await _c.get<Map<String, dynamic>>('/profiles/$userId');
    return res['profile'] as Map<String, dynamic>;
  }

  /// PATCH /candidate/profile with a partial update. `data` uses the
  /// backend's field names + enum casing. Server merges into the
  /// existing row and returns the full profile.
  Future<Map<String, dynamic>> patchMine(Map<String, dynamic> data) async {
    final res = await _c.patch<Map<String, dynamic>>('/candidate/profile', data);
    return res['profile'] as Map<String, dynamic>;
  }

  /// PUT /candidate/profile/education with the full desired list.
  /// Server wipes + re-inserts so the client can send the whole
  /// education state on each save. Backend expects `{education: [...]}`.
  Future<void> replaceEducation(List<Map<String, dynamic>> rows) =>
      _c.request<void>('/candidate/profile/education',
          RequestOpts(method: 'PUT', json: {'education': rows}));

  /// PUT /candidate/profile/experiences — same replace pattern. Body
  /// shape is `{experiences: [...]}`.
  Future<void> replaceExperiences(List<Map<String, dynamic>> rows) =>
      _c.request<void>('/candidate/profile/experiences',
          RequestOpts(method: 'PUT', json: {'experiences': rows}));

  /// PUT /candidate/profile/projects — standalone / personal projects
  /// (distinct from Experience.projects which are role-scoped). Body
  /// shape is `{projects: [...]}`.
  Future<void> replaceProjects(List<Map<String, dynamic>> rows) =>
      _c.request<void>('/candidate/profile/projects',
          RequestOpts(method: 'PUT', json: {'projects': rows}));

  /// PUT /candidate/profile/certifications. Body shape is
  /// `{certifications: [...]}`.
  Future<void> replaceCertifications(List<Map<String, dynamic>> rows) =>
      _c.request<void>('/candidate/profile/certifications',
          RequestOpts(method: 'PUT', json: {'certifications': rows}));

  /// GET /employer/profile — own employer profile.
  Future<Map<String, dynamic>> getMyEmployerProfile() async {
    final res = await _c.get<Map<String, dynamic>>('/employer/profile');
    return res['profile'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> patchMyEmployerProfile(Map<String, dynamic> data) async {
    final res = await _c.patch<Map<String, dynamic>>('/employer/profile', data);
    return res['profile'] as Map<String, dynamic>;
  }
}
