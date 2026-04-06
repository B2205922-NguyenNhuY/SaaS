import 'package:flutter/material.dart';
import '../services/merchant_service.dart';

class MerchantProvider with ChangeNotifier {
  final _service = MerchantService();

  bool isLoading = false;
  bool isLoadingLastPayment = false;

  // ===== PROFILE =====
  Map<String, dynamic>? profile;

  // ===== DASHBOARD =====
  int totalDebt = 0;
  Map<String, dynamic>? lastPayment;

  // ===== DATA =====
  List<Map<String, dynamic>> kiosks = [];
  List<Map<String, dynamic>> pendingCharges = [];
  List<Map<String, dynamic>> debtList = [];

  // ================= PROFILE =================
  Future<void> fetchProfile() async {
    try {
      final data = await _service.getProfile();

      profile = data;
    } catch (e) {
      profile = null;
      print("fetchProfile error: $e");
    }

    notifyListeners();
  }

  Future<void> updateProfile(Map<String, dynamic> data) async {
    isLoading = true;
    notifyListeners();

    try {
      await _service.updateProfile(data);

      await fetchProfile(); // reload lại profile
    } catch (e) {
      rethrow;
    } finally {
      isLoading = false; // ✅ luôn chạy dù success hay lỗi
      notifyListeners();
    }

    isLoading = false;
    notifyListeners();
  }

  // ================= TOTAL DEBT =================
  Future<void> fetchTotalDebt() async {
    isLoading = true;
    notifyListeners();

    try {
      final data = await _service.getDebts();

      int total = 0;

      debtList = data.map((d) {
        final soNo = double.tryParse(d['soTienNo'].toString()) ?? 0;
        total += soNo.toInt();

        return {
          "kiosk": d['maKiosk'],
          "period": d['tenKyThu'],
          "amount": soNo.toInt(),
          "zone": d['tenKhu'],
        };
      }).toList();

      totalDebt = total;

    } catch (e) {
      print("fetchTotalDebt error: $e");
      totalDebt = 0;
      debtList = [];
    }

    isLoading = false;
    notifyListeners();
  }
  
  Future<void> fetchLastPayment() async {
    isLoadingLastPayment = true;
    notifyListeners();

    try {
      final data = await _service.getMyReceipts(); // 🔥 dùng service

      if (data.isEmpty) {
        lastPayment = null;
      } else {
        data.sort((a, b) {
          final dateA = DateTime.tryParse(a['ngayThanhToan'] ?? '') ?? DateTime(2000);
          final dateB = DateTime.tryParse(b['ngayThanhToan'] ?? '') ?? DateTime(2000);
          return dateB.compareTo(dateA);
        });

        final last = data.first;

        lastPayment = {
          "id": last['receipt_id'],
          "amount": double.tryParse(last['soTienThu'].toString()) ?? 0,
          "date": last['thoiGianThu'],
          "method": last['hinhThucThanhToan'],
        };
      }
    } catch (e) {
      print("fetchLastPayment error: $e");
      lastPayment = null;
    }

    isLoadingLastPayment = false;
    notifyListeners();
  }


  // ================= KIOSKS =================
  Future<void> fetchKiosks() async {
    isLoading = true;
    notifyListeners();

    try {
      final data = await _service.getKiosks();

      kiosks = data.map<Map<String, dynamic>>((k) {
        return {
          "id": k['kiosk_id'],
          "maKiosk": k['maKiosk'],
          "viTri": k['viTri'],
          "tenLoai": k['tenLoai'],
          "tenCho": k['tenCho'],
          "tenKhu": k['tenKhu'],
        };
      }).toList();

    } catch (e) {
      kiosks = [];
    }

    isLoading = false;
    notifyListeners();
  }

  // ================= PENDING CHARGES =================
  Future<void> fetchPendingCharges() async {
    try {
      final data = await _service.getCharges();

      pendingCharges = data
          .where((c) =>
              c['trangThai'] == 'chua_thu' ||
              c['trangThai'] == 'no')
          .map<Map<String, dynamic>>((c) {
        final soPhaiThu =
            double.tryParse(c['soTienPhaiThu'].toString()) ?? 0;
        final soDaThu =
            double.tryParse(c['soTienDaThu'].toString()) ?? 0;

        return {
          "kiosk": c['maKiosk'] ?? "Kiosk",
          "period": c['tenKyThu'] ?? "",
          "amount": (soPhaiThu - soDaThu).toInt(),
          "status": c['trangThai'],
        };
      }).toList();

    } catch (e) {
      pendingCharges = [];
    }

    notifyListeners();
  }
}