import '../core/services/api_services.dart';
import 'storage_service.dart';

class MerchantService {
  final ApiService _api = ApiService();

  // ===== PROFILE =====
  Future<Map<String, dynamic>> getProfile() async {
    final res = await _api.get('/merchant/me');
    return Map<String, dynamic>.from(res['data'] ?? res);
  }

  // ===== TOTAL DEBT =====
  Future<List> getDebts() async {
    final res = await _api.get('/debts/merchant/me');
    return res is List ? res : res['data'];
  }

  Future<List<dynamic>> getMyReceipts() async {
  final res = await _api.get('/receipts/me');
  return res['data'];
}

  // ===== KIOSKS =====
  Future<List> getKiosks() async {
    final res = await _api.get('/kioskAssignment/me');
    return res['data'];
  }

  // ===== CHARGES =====
  Future<List> getCharges() async {
    final res = await _api.get('/charges/me');
    return res['data'];
  }

  Future<void> updateProfile(Map<String, dynamic> data) async {
    final api = ApiService();
    await api.put('/merchant/update', data: data);
  }

  Future<void> changePassword(Map<String, dynamic> data) async {
    final storage = StorageService();

    final userId = await storage.getUserId();
    
    await _api.put(
      '/merchant/$userId/password',
      data: data,
    );
  }
}