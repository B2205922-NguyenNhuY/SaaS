import '../core/services/api_services.dart';

class KioskService {
  final api = ApiService();
  Future<Map<String, dynamic>> getKioskDetail(int kioskId) async {
    final res = await api.get('/kiosk/$kioskId');
    return Map<String, dynamic>.from(res);
  }

  Future<Map<String, dynamic>?> getCurrentFee(int kioskId, String kioskType) async {
    try {
        final res = await api.get(
            '/fee_assignments/target',
            query: {
                "target_type": kioskType,
                "target_id": kioskId,
            },
        );
        return res['data'];
    } catch (e) {
        return null;
    }
  }

  Future<Map<String, dynamic>?> getFee({
    required String targetType,
    required int targetId,
    }) async {
    try {
        final res = await ApiService().get(
        '/fee_assignments/target?target_type=$targetType&target_id=$targetId'
        );

        return res['data'];
    } catch (e) {
        return null;
    }
  }
}