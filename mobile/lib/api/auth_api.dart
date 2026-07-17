import 'api_client.dart';

/// Typed wrappers around /auth/*. One method per backend route so
/// providers stay thin — they just orchestrate call + local-cache
/// update, they don't hand-roll HTTP.

/// Roles the backend uses on the wire (uppercase). Different from the
/// mobile app's `Role` enum which is lowerCamelCase.
enum ApiRole { CANDIDATE, EMPLOYER, ADMIN, SUPER_ADMIN, STAFF }

/// OTP purposes the backend accepts. PASSWORD_RESET is used by the
/// forgot-password flow.
enum ApiOtpPurpose { REGISTER, LOGIN, PASSWORD_RESET }

class ApiUser {
  ApiUser({
    required this.id,
    required this.role,
    required this.email,
    required this.emailVerified,
    required this.mobile,
    required this.mobileVerified,
    required this.name,
    required this.createdAt,
    required this.updatedAt,
    required this.lastSeenAt,
    required this.hasPassword,
  });

  final String id;
  final String role; // raw wire value, uppercase
  final String email;
  final bool emailVerified;
  final String? mobile;
  final bool mobileVerified;
  final String name;
  final String createdAt;
  final String updatedAt;
  final String? lastSeenAt;
  final bool hasPassword;

  static ApiUser fromJson(Map<String, dynamic> j) => ApiUser(
        id: j['id'] as String,
        role: j['role'] as String,
        email: j['email'] as String,
        emailVerified: (j['emailVerified'] as bool?) ?? false,
        mobile: j['mobile'] as String?,
        mobileVerified: (j['mobileVerified'] as bool?) ?? false,
        name: j['name'] as String,
        createdAt: j['createdAt'] as String,
        updatedAt: (j['updatedAt'] as String?) ?? '',
        lastSeenAt: j['lastSeenAt'] as String?,
        hasPassword: (j['hasPassword'] as bool?) ?? false,
      );
}

class RegisterResponse {
  RegisterResponse({required this.userId, required this.devCode});
  final String userId;
  /// Populated only when ENABLE_DEV_OTP=true on the server.
  final String? devCode;
}

class VerifyOtpResponse {
  VerifyOtpResponse({required this.user, required this.message});
  final ApiUser user;
  final String message;
}

class AuthApi {
  AuthApi._();
  static final AuthApi instance = AuthApi._();

  final _client = ApiClient.instance;

  /// Register a new candidate or employer. Backend sends the OTP email
  /// and returns the userId + (in dev) the plaintext code.
  Future<RegisterResponse> register({
    required String role, // "CANDIDATE" | "EMPLOYER"
    required String name,
    required String email,
    String? mobile,
  }) async {
    final res = await _client.post<Map<String, dynamic>>('/auth/register', {
      'role': role,
      'name': name,
      'email': email,
      if (mobile != null) 'mobile': mobile,
    });
    return RegisterResponse(
      userId: res['userId'] as String,
      devCode: res['devCode'] as String?,
    );
  }

  /// Request a login OTP for an existing user.
  Future<String?> login(String email) async {
    final res = await _client.post<Map<String, dynamic>>('/auth/login', {
      'email': email,
    });
    return res['devCode'] as String?;
  }

  /// Verify an OTP. Backend sets the JWT cookies + returns the User.
  Future<VerifyOtpResponse> verifyOtp({
    required String email,
    required String code,
    required ApiOtpPurpose purpose,
  }) async {
    final res = await _client.post<Map<String, dynamic>>('/auth/otp/verify', {
      'email': email,
      'code': code,
      'purpose': purpose.name,
    });
    return VerifyOtpResponse(
      user: ApiUser.fromJson(res['user'] as Map<String, dynamic>),
      message: res['message'] as String? ?? '',
    );
  }

  /// Currently-signed-in user based on the httpOnly access cookie.
  /// Throws ApiError 401 when there's no session.
  Future<ApiUser> me() async {
    final res = await _client.get<Map<String, dynamic>>('/auth/me');
    return ApiUser.fromJson(res['user'] as Map<String, dynamic>);
  }

  /// Rotate the refresh + access cookies. Called silently by
  /// ApiClient on 401s — providers shouldn't need to invoke directly.
  Future<void> refresh() async {
    await _client.post<Map<String, dynamic>>('/auth/refresh');
  }

  /// Sign out — server clears the auth cookies. Also clears our local
  /// jar so the next /auth/me returns 401 cleanly.
  Future<void> logout() async {
    try {
      await _client.post<Map<String, dynamic>>('/auth/logout');
    } catch (_) {
      // Even if the server errors, clear locally.
    }
    await _client.clearCookies();
  }

  /// Password login — for STAFF + staff-provisioned EMPLOYER + any user
  /// who's opted into a password after their first OTP session.
  Future<VerifyOtpResponse> passwordLogin(String email, String password) async {
    final res = await _client.post<Map<String, dynamic>>('/auth/password/login', {
      'email': email,
      'password': password,
    });
    return VerifyOtpResponse(
      user: ApiUser.fromJson(res['user'] as Map<String, dynamic>),
      message: res['message'] as String? ?? '',
    );
  }

  /// Kick off password reset — server sends a PASSWORD_RESET OTP if
  /// the email belongs to a user with a passwordHash. Response is
  /// intentionally the same shape whether the account exists or not
  /// (prevents account enumeration).
  Future<void> forgotPassword(String email) async {
    await _client.post<Map<String, dynamic>>('/auth/password/forgot', {
      'email': email,
    });
  }

  /// Finish password reset — verify the OTP + set new password.
  Future<void> resetPassword(String email, String code, String newPassword) async {
    await _client.post<Map<String, dynamic>>('/auth/password/reset', {
      'email': email,
      'code': code,
      'newPassword': newPassword,
    });
  }

  /// Signed-in user changes their own password. Requires the current
  /// password to prove possession.
  Future<void> changePassword(String oldPassword, String newPassword) async {
    await _client.post<Map<String, dynamic>>('/auth/password/change', {
      'oldPassword': oldPassword,
      'newPassword': newPassword,
    });
  }

  /// Signed-in user sets a password for the first time. Backend
  /// refuses (409 PASSWORD_EXISTS) if one already exists — use
  /// changePassword for that case.
  Future<void> setInitialPassword(String newPassword) async {
    await _client.post<Map<String, dynamic>>('/auth/password/set-initial', {
      'newPassword': newPassword,
    });
  }
}
