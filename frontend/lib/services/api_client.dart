import 'dart:convert';
import 'dart:io' show SocketException;

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import 'storage_service.dart';

class ApiClient {
  ApiClient({http.Client? client}) : _client = client ?? http.Client();

  static String get baseUrl {
    if (kIsWeb) {
      return 'http://localhost:3000/api';
    }
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:3000/api';
    }
    return 'http://localhost:3000/api';
  }

  final http.Client _client;
  final StorageService _storage = StorageService();

  Future<dynamic> get(String path, {Map<String, String>? query}) async {
    final response = await _client.get(
      await _buildUri(path, query),
      headers: await _jsonHeaders(),
    );
    return _handleResponse(response);
  }

  Future<dynamic> post(String path, {Map<String, dynamic>? body}) async {
    final response = await _client.post(
      await _buildUri(path, null),
      headers: await _jsonHeaders(),
      body: jsonEncode(body ?? <String, dynamic>{}),
    );
    return _handleResponse(response);
  }

  Future<dynamic> put(String path, {Map<String, dynamic>? body}) async {
    final response = await _client.put(
      await _buildUri(path, null),
      headers: await _jsonHeaders(),
      body: jsonEncode(body ?? <String, dynamic>{}),
    );
    return _handleResponse(response);
  }

  Future<dynamic> postMultipart(
    String path, {
    Map<String, String>? fields,
    String? fileField,
    String? filePath,
  }) async {
    final request = http.MultipartRequest(
      'POST',
      await _buildUri(path, null),
    );

    request.headers.addAll(await _authHeaders());

    if (fields != null) {
      request.fields.addAll(fields);
    }

    if (fileField != null && filePath != null && filePath.trim().isNotEmpty) {
      request.files.add(
        await http.MultipartFile.fromPath(fileField, filePath),
      );
    }

    final streamed = await request.send();
    final response = await http.Response.fromStream(streamed);
    return _handleResponse(response);
  }

  bool isOfflineError(Object error) {
    final text = error.toString().toLowerCase();
    return error is SocketException ||
        text.contains('failed host lookup') ||
        text.contains('connection refused') ||
        text.contains('network is unreachable') ||
        text.contains('không thể kết nối') ||
        text.contains('offline');
  }

  Future<Uri> _buildUri(String path, Map<String, String>? query) async {
    final normalized = path.startsWith('/') ? path : '/$path';
    return Uri.parse('$baseUrl$normalized').replace(
      queryParameters: query == null || query.isEmpty ? null : query,
    );
  }

  Future<Map<String, String>> _jsonHeaders() async {
    return {
      'Content-Type': 'application/json',
      ...await _authHeaders(),
    };
  }

  Future<Map<String, String>> _authHeaders() async {
    final token = await _storage.getToken();
    return {
      if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
    };
  }

  dynamic _handleResponse(http.Response response) {
    dynamic data;
    try {
      data = response.body.isEmpty ? null : jsonDecode(response.body);
    } catch (_) {
      data = response.body;
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return data;
    }

    if (response.statusCode == 401) {
      throw Exception('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }

    if (data is Map<String, dynamic>) {
      throw Exception(
        (data['message'] ?? data['error'] ?? 'Có lỗi xảy ra từ máy chủ')
            .toString(),
      );
    }

    throw Exception('Có lỗi xảy ra từ máy chủ (${response.statusCode}).');
  }
}
