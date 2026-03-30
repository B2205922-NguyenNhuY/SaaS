import 'package:flutter/material.dart';
import '../services/kiosk_service.dart';

class KioskProvider with ChangeNotifier {
  final _service = KioskService();

  bool isLoading = false;
  Map<String, dynamic>? kiosk;
  Map<String, dynamic>? fee;
  Map<int, Map<String, dynamic>?> kioskFees = {};

  int _toInt(dynamic value) {
    if (value is int) return value;
    return int.tryParse(value.toString()) ?? 0;
  }

  Future<Map<String, dynamic>?> _getFeeWithFallback(
      Map<String, dynamic> kiosk) async {

    return await _service.getCurrentFee(
              _toInt(kiosk['kiosk_id']),
              'kiosk',
           ) ??
           await _service.getCurrentFee(
              _toInt(kiosk['zone_id']),
              'zone',
           ) ??
           await _service.getCurrentFee(
              _toInt(kiosk['type_id']),
              'kiosk_type',
           );
  }

  Future<void> fetchKioskDetail(int kioskId) async {
    isLoading = true;
    notifyListeners();

    try {
      // ✅ data là 1 object
      final data = await _service.getKioskDetail(kioskId);

      // ✅ gọi fallback đúng
      final feeData = await _getFeeWithFallback(data);

      kiosk = data;
      fee = feeData;

    } catch (e) {
      print("fetchKioskDetail error: $e");
      kiosk = null;
      fee = null;
    }

    isLoading = false;
    notifyListeners();
  }

  Future<void> fetchKioskFee(Map<String, dynamic> kiosk) async {
    final kioskId = (kiosk['kiosk_id'] as num).toInt();

    if (kioskFees.containsKey(kioskId)) return;

    try {
      /// 🔥 1. ưu tiên kiosk
      var fee = await _service.getFee(
        targetType: 'kiosk',
        targetId: kioskId,
      );
      print("fee1:$fee");

      /// 🔥 2. fallback zone
      if (fee == null) {
        fee = await _service.getFee(
          targetType: 'zone',
          targetId: (kiosk['zone_id'] as num).toInt(),
        );
      }
      print("fee2:$fee");
      /// 🔥 3. fallback type
      if (fee == null) {
        fee = await _service.getFee(
          targetType: 'kiosk_type',
          targetId: (kiosk['type_id'] as num).toInt(),
        );
      }
      print("fee3:$fee");
      kioskFees[kioskId] = fee;
    } catch (e) {
      kioskFees[kioskId] = null;
    }

    notifyListeners();
  }
}