import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

// Ganti dengan IP EC2 saat production
const String apiBase = 'http://YOUR_EC2_IP:8000';

// ── Cloudinary (minta dari Orang 3) ──────────────────────────────────────────
const String cloudName    = 'CLOUD_NAME_DARI_ORANG3';
const String uploadPreset = 'UPLOAD_PRESET_DARI_ORANG3';
// ─────────────────────────────────────────────────────────────────────────────

class ApiService {
  // Ambil token dari SharedPreferences
  static Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token');
  }

  // Header dengan Authorization
  static Future<Map<String, String>> _authHeaders() async {
    final token = await _getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  static Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await http.post(
      Uri.parse('$apiBase/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode == 200) return data;
    throw data['detail'] ?? 'Login gagal';
  }

  static Future<Map<String, dynamic>> register(
      String name, String email, String password) async {
    final res = await http.post(
      Uri.parse('$apiBase/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'name': name, 'email': email, 'password': password}),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode == 201) return data;
    throw data['detail'] ?? 'Registrasi gagal';
  }

  // ── Reports ───────────────────────────────────────────────────────────────

  static Future<Map<String, dynamic>> getReports({
    int page = 1,
    int pageSize = 10,
    String? status,
  }) async {
    final params = {
      'page': '$page',
      'page_size': '$pageSize',
      if (status != null && status.isNotEmpty) 'status': status,
    };
    final uri = Uri.parse('$apiBase/reports').replace(queryParameters: params);
    final res = await http.get(uri, headers: await _authHeaders());
    final data = jsonDecode(res.body);
    if (res.statusCode == 200) return data;
    throw data['detail'] ?? 'Gagal mengambil laporan';
  }

  static Future<Map<String, dynamic>> getReportDetail(String id) async {
    final res = await http.get(
      Uri.parse('$apiBase/reports/$id'),
      headers: await _authHeaders(),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode == 200) return data;
    throw data['detail'] ?? 'Laporan tidak ditemukan';
  }

  static Future<Map<String, dynamic>> createReport({
    required String description,
    required String imageUrl,
    required double latitude,
    required double longitude,
  }) async {
    final res = await http.post(
      Uri.parse('$apiBase/reports'),
      headers: await _authHeaders(),
      body: jsonEncode({
        'description': description,
        'image_url': imageUrl,
        'latitude': latitude,
        'longitude': longitude,
      }),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode == 201) return data;
    throw data['detail'] ?? 'Gagal membuat laporan';
  }

  static Future<void> updateStatus(String reportId, String status) async {
    final res = await http.put(
      Uri.parse('$apiBase/reports/$reportId/status'),
      headers: await _authHeaders(),
      body: jsonEncode({'status': status}),
    );
    if (res.statusCode != 200) {
      final data = jsonDecode(res.body);
      throw data['detail'] ?? 'Gagal update status';
    }
  }

  // ── Cloudinary ────────────────────────────────────────────────────────────

  static Future<String> uploadImage(String filePath) async {
    final req = http.MultipartRequest(
      'POST',
      Uri.parse('https://api.cloudinary.com/v1_1/$cloudName/image/upload'),
    );
    req.fields['upload_preset'] = uploadPreset;
    req.files.add(await http.MultipartFile.fromPath('file', filePath));
    final streamed = await req.send();
    final body = await streamed.stream.bytesToString();
    final data = jsonDecode(body);
    if (data['secure_url'] == null) throw 'Upload gambar gagal';
    return data['secure_url'] as String;
  }

  // ── Session ───────────────────────────────────────────────────────────────

  static Future<void> saveSession(Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('access_token', data['access_token']);
    await prefs.setString('refresh_token', data['refresh_token']);
    await prefs.setString('user', jsonEncode(data['user']));
  }

  static Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }

  static Future<Map<String, dynamic>?> getSavedUser() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString('user');
    if (raw == null) return null;
    return jsonDecode(raw) as Map<String, dynamic>;
  }
}