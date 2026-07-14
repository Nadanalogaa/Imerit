import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

/// Thin wrapper around SharedPreferences so we can swap to a real
/// backend later without touching widgets. Mirrors the web app's
/// `lib/storage.ts` module.
class Storage {
  Storage(this._prefs);
  final SharedPreferences _prefs;

  static late Storage instance;

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    instance = Storage(prefs);
  }

  T get<T>(String key, T fallback) {
    final raw = _prefs.getString(key);
    if (raw == null) return fallback;
    try {
      final decoded = jsonDecode(raw);
      return decoded as T;
    } catch (_) {
      return fallback;
    }
  }

  String? getString(String key) => _prefs.getString(key);

  Future<void> set<T>(String key, T value) =>
      _prefs.setString(key, jsonEncode(value));

  Future<void> setString(String key, String value) =>
      _prefs.setString(key, value);

  Future<void> remove(String key) => _prefs.remove(key);
}

class StorageKeys {
  static const theme = 'itr.theme';
  static const currentUser = 'itr.currentUser';
  static const users = 'itr.users';
  static const candidateProfiles = 'itr.candidateProfiles';
  static const jobs = 'itr.jobs';
  static const subscriptions = 'itr.subscriptions';
  // Employer-side prefs (2026-07): saved candidate searches, shortlist,
  // recently viewed. Each is keyed by employer id inside the value blob so
  // multiple employers sharing a device stay isolated.
  static const employerSavedSearches = 'itr.employer.savedSearches';
  static const employerShortlist = 'itr.employer.shortlist';
  static const employerRecentCandidates = 'itr.employer.recentCandidates';
  static String otp(String email) => 'itr.otp.$email';
}
