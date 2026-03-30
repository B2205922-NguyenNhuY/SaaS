import 'package:dio/dio.dart';
import 'package:go_router/go_router.dart';
import '../../services/storage_service.dart';
import '../../main.dart'; // 🔥 để dùng navigatorKey

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
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        // ================= REQUEST =================
        onRequest: (options, handler) async {
          final token = await _storage.getToken();

          if (token != null && token.isNotEmpty) {
            options.headers["Authorization"] = "Bearer $token";
          }

          return handler.next(options);
        },

        // ================= ERROR =================
        onError: (DioException e, handler) async {
          if (e.response?.statusCode == 401) {
            print("❌ Token expired → logout");

            if (_isRedirecting) return handler.next(e);
            _isRedirecting = true;

            // 🔥 clear session
            await _storage.clearSession();

            // 🔥 redirect về login
            Future.delayed(const Duration(milliseconds: 300), () {
              final context = navigatorKey.currentContext;

              if (context != null) {
                GoRouter.of(context).go('/auth');
              }

              _isRedirecting = false;
            });
          }

          return handler.next(e);
        },
      ),
    );

    /// log debug
    _dio.interceptors.add(
      LogInterceptor(
        requestBody: true,
        responseBody: true,
      ),
    );
  }

  // ================= GET =================
  Future<dynamic> get(String path,
      {Map<String, dynamic>? query}) async {
    final res = await _dio.get(path, queryParameters: query);
    return res.data;
  }

  // ================= POST =================
  Future<dynamic> post(String path, dynamic data) async {
    final res = await _dio.post(path, data: data);
    return res.data;
  }

  // ================= PUT =================
  Future<dynamic> put(String path, dynamic data) async {
    final res = await _dio.put(path, data: data);
    return res.data;
  }

  // ================= DELETE =================
  Future<dynamic> delete(String path) async {
    final res = await _dio.delete(path);
    return res.data;
  }
}