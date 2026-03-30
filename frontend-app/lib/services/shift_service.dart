import 'dart:convert';
import 'package:http/http.dart' as http;
import 'storage_service.dart';

class ShiftService {
  final _storage = StorageService();

  // 🔥 BASE URL (đổi lại theo backend)
  final String baseUrl = "http://10.0.2.2:3000/api/shifts"; // Android emulator

  // ================= HEADER =================
  Future<Map<String, String>> _headers() async {
    final token = await _storage.getToken();

    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  // ================= GET ACTIVE SHIFT =================
  Future<Map<String, dynamic>?> getActiveShift() async {
    final res = await http.get(
      Uri.parse('$baseUrl/active'),
      headers: await _headers(),
    );

    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);

      // backend trả { shift: ... }
      return data;
    }

    return null; 
  }

  // ================= CHECK SHIFT =================
  Future<bool> hasOpenShift() async {
    final shift = await getActiveShift();
    return shift != null;
  }

  // ================= START SHIFT =================
  Future<Map<String, dynamic>> startShift(int marketId) async {
    final res = await http.post(
      Uri.parse('$baseUrl/start'),
      headers: await _headers(),
      body: jsonEncode({
        "market_id": marketId,
      }),
    );

    if (res.statusCode == 200 || res.statusCode == 201) {
      return jsonDecode(res.body);
    }

    throw Exception('Mở ca thất bại: ${res.body}');
  }

  // ================= END SHIFT =================
  Future<void> endShift() async {
    final res = await http.post(
      Uri.parse('$baseUrl/end'),
      headers: await _headers(),
    );

    if (res.statusCode != 200) {
      throw Exception('Đóng ca thất bại: ${res.body}');
    }
  }

  // ================= GET SHIFT LIST (ADMIN) =================
  Future<List<dynamic>> getShifts({
    int page = 1,
    int limit = 10,
  }) async {
    final res = await http.get(
      Uri.parse('$baseUrl?page=$page&limit=$limit'),
      headers: await _headers(),
    );

    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      return data['data'] ?? [];
    }

    throw Exception('Không lấy được danh sách ca');
  }
}