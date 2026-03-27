import 'dart:convert';
import 'dart:io' show SocketException;

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class AuthService {
  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:3000/api/auth';
    }
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:3000/api/auth';
    }
    return 'http://localhost:3000/api/auth';
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
        }),
      );

      final data = response.body.isEmpty
          ? <String, dynamic>{}
          : jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return data;
      }

      throw Exception((data['message'] ?? 'Đăng nhập thất bại').toString());
    } on SocketException {
      throw Exception(
          'Không thể kết nối server. Kiểm tra backend đã chạy chưa!');
    } catch (e) {
      if (e is Exception) rethrow;
      throw Exception(
          'Không thể kết nối server. Kiểm tra backend đã chạy chưa!');
    }
  }

  Future<Map<String, dynamic>> googleLogin() async {
    throw Exception('Google Sign-In chưa được cấu hình');
  }

  Future<void> logout() async {
    try {
      await http.post(
        Uri.parse('$baseUrl/logout'),
        headers: {'Content-Type': 'application/json'},
      );
    } catch (_) {}
  }
}
