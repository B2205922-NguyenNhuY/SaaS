import 'dart:convert';
import 'package:http/http.dart' as http;

class AuthService {
  static const String baseUrl = 'http://localhost:3000/api/auth';

  // Đăng nhập thường 
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email':    email,
          'password': password,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        return data;
      } else {
        throw Exception(data['message'] ?? 'Đăng nhập thất bại');
      }
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception('Không thể kết nối server. Kiểm tra backend đã chạy chưa!');
    }
  }

  // Đăng nhập Google 
  Future<Map<String, dynamic>> googleLogin() async {
    throw Exception('Google Sign-In chưa được cấu hình');
  }

  // Đăng xuất 
  Future<void> logout() async {
    try {
      await http.post(
        Uri.parse('$baseUrl/logout'),
        headers: {'Content-Type': 'application/json'},
      );
    } catch (_) {
    }
  }
}