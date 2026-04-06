import 'package:shared_preferences/shared_preferences.dart';

class StorageService {
  static const _tokenKey = 'jwt_token';
  static const _roleKey  = 'user_role';
  static const _nameKey  = 'user_name';
  static const _emailKey = 'user_email';
  static const _idKey    = 'user_id';

  // ================= SAVE =================
  Future<void> saveSession({
    required String token,
    required String role,
    required String name,
    required String email,
    required String id,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_roleKey, role);
    await prefs.setString(_nameKey, name);
    await prefs.setString(_emailKey, email);
    await prefs.setString(_idKey, id);
  }

  // ================= GET =================
  Future<Map<String, dynamic>?> getSession() async {
    final prefs = await SharedPreferences.getInstance();

    final token = prefs.getString(_tokenKey);
    final role  = prefs.getString(_roleKey);
    final name  = prefs.getString(_nameKey);
    final email = prefs.getString(_emailKey);
    final id    = prefs.getString(_idKey);

    if (token == null) return null;

    return {
      'token': token,
      'role': role,
      'name': name,
      'email': email,
      'id': id,
    };
  }

  // ================= GET TOKEN =================
  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_tokenKey);

  print("🔥 TOKEN lấy từ storage: $token");
    return prefs.getString(_tokenKey);
  }

  // ================= GET ROLE =================
  Future<String?> getRole() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_roleKey);
  }

  // ================= CLEAR =================
  Future<void> clearSession() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_roleKey);
    await prefs.remove(_nameKey);
    await prefs.remove(_emailKey);
    await prefs.remove(_idKey);
  }
}