import 'dart:convert';
import 'dart:math';
import '../storage/storage.dart';

/// Simple OTP utility for the prototype.
/// Generates a 6-digit code, stores it in SharedPreferences with 10-min expiry,
/// and returns it so the UI can show it on-screen ("Demo OTP: 123456").
class OtpService {
  static String _key(String email) =>
      StorageKeys.otp(email.toLowerCase());

  static String generate(String email) {
    final code = (Random().nextInt(900000) + 100000).toString();
    final expiresAt = DateTime.now()
        .add(const Duration(minutes: 10))
        .toIso8601String();
    Storage.instance.setString(
      _key(email),
      jsonEncode({'code': code, 'expiresAt': expiresAt}),
    );
    return code;
  }

  static bool verify(String email, String code) {
    final raw = Storage.instance.getString(_key(email));
    if (raw == null) return false;
    final m = jsonDecode(raw) as Map<String, dynamic>;
    final stored = m['code'] as String;
    final expiresAt = DateTime.parse(m['expiresAt'] as String);
    if (DateTime.now().isAfter(expiresAt)) {
      Storage.instance.remove(_key(email));
      return false;
    }
    if (stored != code) return false;
    Storage.instance.remove(_key(email));
    return true;
  }

  static String? active(String email) {
    final raw = Storage.instance.getString(_key(email));
    if (raw == null) return null;
    final m = jsonDecode(raw) as Map<String, dynamic>;
    final expiresAt = DateTime.parse(m['expiresAt'] as String);
    if (DateTime.now().isAfter(expiresAt)) return null;
    return m['code'] as String;
  }
}
