import 'package:dio/dio.dart';
import 'dart:io';
import 'package:go_router/go_router.dart';
import '../../services/storage_service.dart';
import '../../main.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;

  bool _isRedirecting = false;

  late Dio _dio;
  final StorageService _storage = StorageService();

  ApiService._internal() {
    _dio = Dio(
      BaseOptions(
        baseUrl: "http://10.0.2.2:3000/api",
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        headers: {
          "Content-Type": "application/json",
        },
        validateStatus: (status) => true, // 🔥 QUAN TRỌNG: không auto throw
      ),
    );

    // ================= INTERCEPTOR =================
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.getToken();

          if (token != null && token.isNotEmpty) {
            options.headers["Authorization"] = "Bearer $token";
          }

          return handler.next(options);
        },

        onError: (DioException e, handler) async {
          if (e.response?.statusCode == 401) {
            if (_isRedirecting) return handler.next(e);
            _isRedirecting = true;

            await _storage.clearSession();

            Future.delayed(const Duration(milliseconds: 300), () {
              final context = navigatorKey.currentContext;

              if (context != null && context.mounted) {
                GoRouter.of(context).go('/auth');
              }

              _isRedirecting = false;
            });
          }

          return handler.next(e);
        },
      ),
    );

    _dio.interceptors.add(
      LogInterceptor(requestBody: true, responseBody: true),
    );
  }

  // ================= CORE HANDLE =================

  dynamic _handleResponse(Response res) {
    if (res.statusCode! >= 200 && res.statusCode! < 300) {
      return res.data;
    }

    // 🔥 Lấy message backend
    final message = res.data?['message'] ?? "Có lỗi xảy ra";
    throw Exception(message);
  }

  // ================= BASIC METHODS =================

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) async {
    try {
      final res = await _dio.get(path, queryParameters: query);
      return _handleResponse(res);
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<dynamic> post(String path, {Map<String, dynamic>? data}) async {
    try {
      final res = await _dio.post(path, data: data ?? {});
      return _handleResponse(res);
    } catch (e) {
      print("ERROR TYPE: ${e.runtimeType}");
      print("ERROR: $e");
      throw _handleError(e);
    }
  }

  Future<dynamic> put(String path, {Map<String, dynamic>? data}) async {
    try {
      final res = await _dio.put(path, data: data ?? {});
      return _handleResponse(res);
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<dynamic> patch(String path, {Map<String, dynamic>? data}) async {
    try {
      final res = await _dio.patch(path, data: data ?? {});
      return _handleResponse(res);
    } catch (e) {
      throw _handleError(e);
    }
  }

  Future<dynamic> delete(String path, {Map<String, dynamic>? data}) async {
    try {
      final res = await _dio.delete(path, data: data);
      return _handleResponse(res);
    } catch (e) {
      throw _handleError(e);
    }
  }

  // ================= MULTIPART =================

  Future<dynamic> postMultipart(
    String path, {
    Map<String, String>? fields,
    String? fileField,
    String? filePath,
  }) async {
    try {
      final formData = FormData();

      if (fields != null) {
        fields.forEach((key, value) {
          formData.fields.add(MapEntry(key, value));
        });
      }

      if (fileField != null &&
          filePath != null &&
          filePath.trim().isNotEmpty) {
        formData.files.add(
          MapEntry(
            fileField,
            await MultipartFile.fromFile(
              filePath,
              filename: filePath.split('/').last,
            ),
          ),
        );
      }

      final res = await _dio.post(
        path,
        data: formData,
        options: Options(
          headers: {
            "Content-Type": "multipart/form-data",
          },
        ),
      );

      return _handleResponse(res);
    } catch (e) {
      throw _handleError(e);
    }
  }

  // ================= ERROR HANDLE =================

  Exception _handleError(Object error) {
    if (error is DioException) {
      // offline
      if (error.type == DioExceptionType.connectionError ||
          error.type == DioExceptionType.connectionTimeout) {
        return Exception("Không có kết nối mạng");
      }

      final message = error.response?.data?['message'];
      if (message != null) {
        return Exception(message);
      }
    }

    if (error is Exception) {
      return error;
    }

    return Exception("Lỗi không xác định");
  }

  bool isOfflineError(Object error) {
    if (error is DioException) {
      return error.type == DioExceptionType.connectionError ||
          error.type == DioExceptionType.connectionTimeout;
    }

    if (error is SocketException) {
      return true;
    }

    // 🔥 fallback khi bị wrap thành Exception
    if (error is Exception) {
      final msg = error.toString().toLowerCase();
      return msg.contains("kết nối") ||
          msg.contains("network") ||
          msg.contains("socket") ||
          msg.contains("failed");
    }

    return false;
  }
}