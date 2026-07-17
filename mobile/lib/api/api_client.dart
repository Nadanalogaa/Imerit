import 'dart:async';
import 'dart:convert';
import 'package:cookie_jar/cookie_jar.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

/// Mobile-side counterpart to web's `lib/api.ts` — a thin fetch wrapper
/// around the backend REST API with cookie-based auth + silent refresh
/// on 401. Every mobile provider that needs server data goes through
/// this client so swapping the transport (mocking in tests, adding
/// retry policies, adding tracing) is one file's problem.
///
/// Design notes:
///   - Cookies (itr_access + itr_refresh) live in a CookieJar because
///     mobile HTTP libs don't auto-persist cookies like browsers do.
///     We attach + parse Set-Cookie on every request/response manually.
///   - Silent refresh dedupes concurrent refresh attempts so a burst of
///     401s (multiple screens all firing at once) still only hits
///     /auth/refresh once — otherwise the refresh token rotation would
///     race and the later refresh would use an already-rotated token.
///   - `apiEnabled` is true iff `--dart-define=API_BASE_URL=…` was set
///     at build time. When it's off, callers fall back to localStorage
///     mode (matches the web app's `apiEnabled` pattern).

/// Backend base URL. Override at build time:
///   flutter run --dart-define=API_BASE_URL=https://itamilrecruit.net/api
///
/// Left blank in the app-defaults build so a fresh install runs offline
/// against SharedPreferences until it's pointed at a server.
const String kApiBaseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: 'https://itamilrecruit.net/api');

bool get apiEnabled => kApiBaseUrl.isNotEmpty;

/// Structured error type mirroring web's `ApiError` so provider code
/// can `if (e is ApiError && e.code == 'EMAIL_TAKEN')` the same way.
class ApiError implements Exception {
  ApiError({required this.status, required this.code, required this.message, this.details});
  final int status;
  final String code;
  final String message;
  final Object? details;

  @override
  String toString() => 'ApiError($status $code): $message';
}

/// Options for a request. `json` gets JSON-encoded + Content-Type set.
class RequestOpts {
  const RequestOpts({this.method = 'GET', this.json, this.headers});
  final String method;
  final Object? json; // Map<String, dynamic> | List | null
  final Map<String, String>? headers;
}

/// Singleton API client. All requests + refresh flow through this.
class ApiClient {
  ApiClient._();
  static final ApiClient instance = ApiClient._();

  final CookieJar _cookies = CookieJar();
  Future<bool>? _refreshInFlight;

  /// Perform a request and parse the JSON body into type T. Throws
  /// ApiError on non-2xx responses.
  Future<T> request<T>(String path, [RequestOpts opts = const RequestOpts()]) async {
    if (!apiEnabled) {
      throw ApiError(status: 0, code: 'API_DISABLED', message: 'API is not configured for this build');
    }
    final res = await _send(path, opts);
    // 401 with a refresh cookie in play → try one silent refresh + retry once.
    if (res.statusCode == 401 && !path.contains('/auth/refresh') && !path.contains('/auth/login') && !path.contains('/auth/password/login') && !path.contains('/auth/otp/verify')) {
      final refreshed = await _refreshOnce();
      if (refreshed) {
        final retry = await _send(path, opts);
        return _decode<T>(retry);
      }
    }
    return _decode<T>(res);
  }

  /// Low-level convenience wrappers for the common verbs.
  Future<T> get<T>(String path) => request<T>(path, const RequestOpts(method: 'GET'));
  Future<T> post<T>(String path, [Object? json]) => request<T>(path, RequestOpts(method: 'POST', json: json));
  Future<T> patch<T>(String path, [Object? json]) => request<T>(path, RequestOpts(method: 'PATCH', json: json));
  Future<T> delete<T>(String path) => request<T>(path, const RequestOpts(method: 'DELETE'));

  /// Clear the cookie jar. Used on logout so a subsequent /auth/me
  /// call cleanly returns 401 (which the provider tracks as "signed out").
  Future<void> clearCookies() async {
    await _cookies.deleteAll();
  }

  // ---------- internals ----------

  Future<http.Response> _send(String path, RequestOpts opts) async {
    final uri = Uri.parse('$kApiBaseUrl$path');
    final headers = <String, String>{
      'Accept': 'application/json',
      ...?opts.headers,
    };

    // Attach cookies our jar knows for this host.
    final cookies = await _cookies.loadForRequest(uri);
    if (cookies.isNotEmpty) {
      headers['Cookie'] = cookies.map((c) => '${c.name}=${c.value}').join('; ');
    }

    String? body;
    if (opts.json != null) {
      body = jsonEncode(opts.json);
      headers['Content-Type'] = 'application/json';
    }

    late http.Response res;
    switch (opts.method) {
      case 'GET':    res = await http.get(uri, headers: headers); break;
      case 'POST':   res = await http.post(uri, headers: headers, body: body); break;
      case 'PATCH':  res = await http.patch(uri, headers: headers, body: body); break;
      case 'PUT':    res = await http.put(uri, headers: headers, body: body); break;
      case 'DELETE': res = await http.delete(uri, headers: headers, body: body); break;
      default:
        throw ApiError(status: 0, code: 'BAD_METHOD', message: 'Unsupported HTTP method ${opts.method}');
    }

    // Persist any Set-Cookie headers into the jar. The `http` package
    // gives us the raw header string — parse into cookies ourselves
    // since dart:io's HttpClient (which cookie_jar prefers) isn't in
    // the mix here.
    _storeCookiesFromResponse(uri, res);
    return res;
  }

  void _storeCookiesFromResponse(Uri uri, http.Response res) {
    // The `http` package concatenates multiple Set-Cookie headers with
    // commas, but commas are legal inside cookie values (dates!) —
    // parsing needs to be a bit careful. We split on ", " that's
    // followed by a `key=` pattern, which reliably marks the start of
    // a new cookie.
    final raw = res.headers['set-cookie'];
    if (raw == null || raw.isEmpty) return;
    final parts = _splitCookies(raw);
    final parsed = <Cookie>[];
    for (final part in parts) {
      try {
        parsed.add(Cookie.fromSetCookieValue(part));
      } catch (_) {
        // Skip malformed cookies rather than blowing up the request.
      }
    }
    if (parsed.isNotEmpty) {
      // Fire-and-forget — the jar writes to memory synchronously enough
      // for our subsequent requests to see the new cookies.
      _cookies.saveFromResponse(uri, parsed);
    }
  }

  List<String> _splitCookies(String raw) {
    // Split on ", " immediately followed by an attribute-safe token=
    // (letters/digits/dashes/underscores + =). Anything else is a
    // value with a comma inside.
    final out = <String>[];
    final pattern = RegExp(r',(?=\s*[A-Za-z0-9_-]+=)');
    final chunks = raw.split(pattern);
    for (final c in chunks) {
      final trimmed = c.trim();
      if (trimmed.isNotEmpty) out.add(trimmed);
    }
    return out;
  }

  T _decode<T>(http.Response res) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      if (res.body.isEmpty) return null as T;
      final decoded = jsonDecode(res.body);
      return decoded as T;
    }
    // Error path — try to pull the structured { error: { code, message } }
    // body the backend always returns.
    String code = 'UNKNOWN';
    String message = 'Request failed (${res.statusCode})';
    Object? details;
    try {
      final j = jsonDecode(res.body);
      if (j is Map && j['error'] is Map) {
        final err = j['error'] as Map;
        code = (err['code'] as String?) ?? code;
        message = (err['message'] as String?) ?? message;
        details = err['details'];
      }
    } catch (_) {
      // Body wasn't JSON — keep defaults.
    }
    if (kDebugMode) {
      // Non-fatal debug print so failures are visible in dev without
      // needing to attach a logger.
      // ignore: avoid_print
      print('[api] ${res.statusCode} $code: $message');
    }
    throw ApiError(status: res.statusCode, code: code, message: message, details: details);
  }

  /// Try one silent refresh. Returns true if we got fresh cookies.
  /// Dedupes concurrent callers so we only hit /auth/refresh once.
  Future<bool> _refreshOnce() async {
    _refreshInFlight ??= () async {
      try {
        final res = await _send('/auth/refresh', const RequestOpts(method: 'POST'));
        return res.statusCode >= 200 && res.statusCode < 300;
      } catch (_) {
        return false;
      }
    }();
    try {
      return await _refreshInFlight!;
    } finally {
      _refreshInFlight = null;
    }
  }
}
