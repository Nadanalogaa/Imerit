import 'api_client.dart';

/// Wrapper over /profiles/me + /profiles/:userId + related PATCH
/// endpoints. Same lazy-on-first-hit shape as the web app.
class ProfileApi {
  ProfileApi._();
  static final ProfileApi instance = ProfileApi._();
  final _c = ApiClient.instance;

  /// Own profile — server returns { profile, user }.
  Future<Map<String, dynamic>> getMine() async {
    final res = await _c.get<Map<String, dynamic>>('/profiles/me');
    return res;
  }

  /// Someone else's profile by userId (employer + admin views).
  /// Backend returns 404 for unapproved profiles when caller is a
  /// non-admin, non-owner viewer (curated-marketplace visibility).
  Future<Map<String, dynamic>> getByUserId(String userId) async {
    final res = await _c.get<Map<String, dynamic>>('/profiles/$userId');
    return res['profile'] as Map<String, dynamic>;
  }

  /// PATCH /profiles/me with a partial update. `data` uses the
  /// backend's field names + enum casing. Server merges into the
  /// existing row and returns the full profile.
  Future<Map<String, dynamic>> patchMine(Map<String, dynamic> data) async {
    final res = await _c.patch<Map<String, dynamic>>('/profiles/me', data);
    return res['profile'] as Map<String, dynamic>;
  }

  /// PUT /profiles/me/education with the full desired list. Server
  /// wipes + re-inserts so the frontend can just send the whole
  /// education state on each save.
  Future<void> replaceEducation(List<Map<String, dynamic>> rows) =>
      _c.request<void>('/profiles/me/education', RequestOpts(method: 'PUT', json: {'rows': rows}));

  /// PUT /profiles/me/experiences — same replace pattern.
  Future<void> replaceExperiences(List<Map<String, dynamic>> rows) =>
      _c.request<void>('/profiles/me/experiences', RequestOpts(method: 'PUT', json: {'rows': rows}));

  /// GET /employer/profile/me — own employer profile.
  Future<Map<String, dynamic>> getMyEmployerProfile() async {
    final res = await _c.get<Map<String, dynamic>>('/employer/profile/me');
    return res['profile'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> patchMyEmployerProfile(Map<String, dynamic> data) async {
    final res = await _c.patch<Map<String, dynamic>>('/employer/profile/me', data);
    return res['profile'] as Map<String, dynamic>;
  }
}
