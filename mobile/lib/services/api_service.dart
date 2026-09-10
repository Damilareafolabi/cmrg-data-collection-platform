import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/models.dart';

class ApiService {
  static const String defaultBaseUrl = 'http://10.0.2.2:3000'; // Standard Android Emulator loopback
  static const String serverUrlKey = 'cmrg_server_url';
  static const String authTokenKey = 'cmrg_auth_token';

  static Future<String> getBaseUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(serverUrlKey) ?? defaultBaseUrl;
  }

  static Future<void> setBaseUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(serverUrlKey, url.endsWith('/') ? url.substring(0, url.length - 1) : url);
  }

  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(authTokenKey);
  }

  static Future<void> setToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(authTokenKey, token);
  }

  /// Login enumerator/supervisor
  static Future<User?> login(String email, String password) async {
    final baseUrl = await getBaseUrl();
    final url = Uri.parse('$baseUrl/api/auth/login');

    try {
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['token'] != null) {
          await setToken(data['token']);
        }
        return User.fromJson(data['user']);
      }
    } catch (e) {
      print('Login error: $e');
    }
    return null;
  }

  /// Fetch list of published forms assigned to enumerator
  static Future<List<FormDefinition>> fetchForms() async {
    final baseUrl = await getBaseUrl();
    final token = await getToken();
    final url = Uri.parse('$baseUrl/api/forms');
    final headers = <String, String>{'Content-Type': 'application/json'};
    if (token != null) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    /// Resolve a DP-issued deployment code to its published questionnaire.
    static Future<FormDefinition> resolveAccessCode(String code) async {
      final baseUrl = await getBaseUrl();
      final response = await http.get(
        Uri.parse('$baseUrl/api/access-codes/${Uri.encodeComponent(code.trim())}'),
        headers: await _authHeaders(),
      );
      final data = jsonDecode(response.body);
      if (response.statusCode != 200) {
        throw Exception(data['error'] ?? 'Invalid or expired access code');
      }
      return FormDefinition.fromJson(data['form']);
    }

    static Future<Map<String, String>> _authHeaders() async {
      final token = await getToken();
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (token != null) headers['Authorization'] = 'Bearer $token';
      return headers;
    }

    try {
      final response = await http.get(url, headers: headers);

      if (response.statusCode == 200) {
        final List list = jsonDecode(response.body);
        return list.map((item) => FormDefinition.fromJson(item)).toList();
      }
    } catch (e) {
      print('Fetch forms error: $e');
    }
    return [];
  }

  /// Synchronize batch of completed submissions with idempotency
  static Future<Map<String, dynamic>> syncSubmissions({
    required List<SubmissionRecord> submissions,
    required String deviceId,
    required String enumeratorId,
    required String enumeratorName,
  }) async {
    final baseUrl = await getBaseUrl();
    final token = await getToken();
    final url = Uri.parse('$baseUrl/api/submissions/sync');

    try {
      final payload = {
        'submissions': submissions.map((s) => s.toJson()).toList(),
        'deviceId': deviceId,
        'enumeratorId': enumeratorId,
        'enumeratorName': enumeratorName,
      };
      final headers = <String, String>{'Content-Type': 'application/json'};
      if (token != null) {
        headers['Authorization'] = 'Bearer ' + token;
      }

      final response = await http.post(
        url,
        headers: headers,
        body: jsonEncode(payload),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        return {'success': false, 'error': 'Server returned ${response.statusCode}'};
      }
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }
}
