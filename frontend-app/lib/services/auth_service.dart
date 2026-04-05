import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/config/api_config.dart';
import 'storage_service.dart';
import 'package:dio/dio.dart';


class AuthService {
  final Dio _dio = Dio(BaseOptions(
    baseUrl: ApiConfig.baseUrl,
    headers: {'Content-Type': 'application/json'},
  ));

  // 🔐 LOGIN
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      print("gọi hàm login");
      final response = await _dio.post(
        '/auth/login',
        data: {
          'email': email, // hoặc phone tùy backend
          'password': password,
        },
      );
      print("tiếp response auth: $response");

      final data = response.data; // ✅ parse trước

      final token = data['token'];
      final user = data['user'];

        if (token == null || user == null) {
          throw Exception("Dữ liệu trả về không hợp lệ");
        }

        await StorageService().saveSession(
          token: token,
          role: user['role'] ?? '',
          name: user['name'] ?? user['hoTen'] ?? '',
          email: user['email'] ?? '', // ❗ backend không trả email → để rỗng
          id: user['id'].toString(),
        );
        return data;
      
      } on DioException catch (e) {
        print("🔥 STATUS: ${e.response?.statusCode}");
        print("🔥 DATA: ${e.response?.data}");
        print("🔥 ERROR: ${e.message}");
        final msg = e.response?.data?['message'] ?? 'Đăng nhập thất bại';
        throw Exception(msg);
      }
  }

  Future<Map<String, dynamic>> loginWithGoogle(String idToken) async {
    final res = await _dio.post(
      '/auth/google-login',
      data: {
        'idToken': idToken,
      },
    );

    return res.data;
  }

  // 🔓 LOGOUT
  Future<void> logout() async {
    try {
      await _dio.post('/auth/logout');
    } catch (_) {}
  }
}