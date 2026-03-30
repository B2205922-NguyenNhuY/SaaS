import 'package:flutter/material.dart';
import '../services/shift_service.dart';

class ShiftProvider extends ChangeNotifier {
  final _service = ShiftService();

  Map<String, dynamic>? currentShift;
  bool isLoading = false;

  bool get hasShift => currentShift != null;

  // ================= CHECK =================
  Future<void> checkShift() async {
    isLoading = true;
    notifyListeners();

    try {
      final shift = await _service.getActiveShift();

      currentShift = shift;
    } catch (e) {
      currentShift = null;
    }

    isLoading = false;
    notifyListeners();
  }

  // ================= START =================
  Future<void> startShift(int marketId) async {
    isLoading = true;
    notifyListeners();

   try {
      // 🔥 gửi market_id lên backend
      await _service.startShift(marketId);

      // 🔥 gọi lại để lấy full thông tin shift
      await checkShift();

    } catch (e) {
      rethrow;
    }finally {
      // 🔥 LUÔN chạy dù success hay fail
      isLoading = false;
      notifyListeners();
    }
  }

  // ================= END =================
  Future<void> endShift() async {
    isLoading = true;
    notifyListeners();

    try {
      await _service.endShift();
      currentShift = null;
    } catch (e) {
      rethrow;
    }
    isLoading = false;
    notifyListeners();
  }
}