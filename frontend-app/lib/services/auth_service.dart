import 'dart:convert';
import 'package:http/http.dart' as http;
import '../core/config/api_config.dart';
import 'storage_service.dart';
import 'package:dio/dio.dart';
import '../core/services/api_services.dart';


class AuthService {
  final ApiService _api = ApiService();
  final StorageService _storage = StorageService();

  // 🔐 LOGIN
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      print("🔥 gọi login");

      final res = await _api.post(
        '/auth/login',
        data: {
          'email': email,
          'password': password,
        },
      );

      final token = res['token'];
      final user = res['user'];

      if (token == null || user == null) {
        throw Exception("Dữ liệu trả về không hợp lệ");
      }

      await _storage.saveSession(
        token: token,
        role: user['role'] ?? '',
        name: user['name'] ?? user['hoTen'] ?? '',
        email: user['email'] ?? '',
        id: user['id'].toString(),
      );

      print("✅ login thành công");
      return res;

    } on DioException catch (e) {
      throw Exception(_handleDioError(e));
    } catch (e) {
      throw Exception("Lỗi không xác định khi đăng nhập");
    }
  }

  // 🔓 LOGOUT
  Future<void> logout() async {
    try {
      print("🔥 gọi logout");

      await _api.post('/auth/logout');

      print("✅ logout thành công");

    } on DioException catch (e) {
      // ❗ logout lỗi vẫn cho pass (quan trọng)
      print("❌ logout lỗi nhưng vẫn tiếp tục");
      print(_handleDioError(e));

      // 👉 không throw để tránh crash UI
    } catch (e) {
      print("❌ lỗi lạ logout: $e");
    }
  }

  Future<Map<String, dynamic>> loginWithGoogle(String idToken) async {
    final res = await _api.post(
      '/auth/google-login',
      data: {
        'idToken': idToken,
      },
    );

    return res.data;
  }

  // ================= ERROR HANDLER =================
  String _handleDioError(DioException e) {
    print("🔥 DIO ERROR TYPE: ${e.type}");
    print("🔥 STATUS: ${e.response?.statusCode}");
    print("🔥 DATA: ${e.response?.data}");

    // 🔥 server trả về message
    if (e.response != null && e.response?.data != null) {
      final data = e.response!.data;

      if (data is Map && data['message'] != null) {
        return data['message'].toString();
      }
    }

    // 🔥 các lỗi phổ biến
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
        return "Kết nối quá lâu (timeout)";
      case DioExceptionType.sendTimeout:
        return "Gửi dữ liệu quá lâu";
      case DioExceptionType.receiveTimeout:
        return "Nhận dữ liệu quá lâu";
      case DioExceptionType.badResponse:
        return "Lỗi phản hồi từ server (${e.response?.statusCode})";
      case DioExceptionType.cancel:
        return "Request đã bị huỷ";
      case DioExceptionType.unknown:
        return "Không có kết nối mạng";
      default:
        return "Lỗi không xác định";
    }
  }
}

  
