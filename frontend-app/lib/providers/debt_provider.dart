import 'package:flutter/material.dart';
import '../core/services/api_services.dart';

class DebtProvider with ChangeNotifier {
  final api = ApiService();

  bool isLoadingDebts = false;
  bool isPaying = false;
  List<Map<String, dynamic>> debts = [];

  /// ================= FETCH =================
  Future<void> fetchDebts() async {
    print("🔥 FETCH DEBTS CALLED");

    isLoadingDebts = true;
    notifyListeners();

    try {
      final res = await api.get('/debts/merchant/me');

      final raw = res is List ? res : res['data'];
      final data = List<Map<String, dynamic>>.from(raw);


      debts = data.map((d) {
        return {
          "id": d['charge_id'],
          "kiosk": d['maKiosk'],
          "zone": d['tenKhu'],
          "period": d['tenKyThu'],
          "amount": (double.tryParse(d['soTienNo'].toString()) ?? 0).toInt(),
          "date": (d['period_id'] as num).toInt(), // 🔥 ép kiểu chắc chắn
          "selected": false,
        };
      }).toList();

      /// 🔥 sort từ cũ → mới
      debts.sort((a, b) =>
          (a['date'] as int).compareTo(b['date'] as int));

    } catch (e) {
      print("fetchDebts error: $e");
      debts = [];
    }

    isLoadingDebts = false;
    notifyListeners();
  }

  Future<String?> createMomoPayment() async {
    isPaying = true;
    notifyListeners();
    try {
        final ids = selectedChargeIds;

        if (ids.isEmpty) {
        throw Exception("Chưa chọn khoản thanh toán");
        }

        final res = await api.post('/payment/create-momo', {
        "chargeIds": ids,
        });

        print("MOMO RES: $res");

        /// 🔥 backend thường trả về link thanh toán
        return res['payUrl']; 
    } catch (e) {
        print("createMomoPayment error: $e");
        rethrow;
    } finally {
        isPaying = false;
        notifyListeners();
    }
  }

  /// ================= LOGIC SELECT =================

  bool canSelect(int index) {
    for (int i = 0; i < index; i++) {
      if (debts[i]['selected'] == false) return false;
    }
    return true;
  }

  void toggleDebt(int index) {
    if (!canSelect(index)) return;

    debts[index]['selected'] =
        !(debts[index]['selected'] as bool);

    /// ❌ bỏ chọn → reset phía sau
    if (debts[index]['selected'] == false) {
      for (int i = index + 1; i < debts.length; i++) {
        debts[i]['selected'] = false;
      }
    }

    notifyListeners();
  }

  void selectAllDebts() {
    for (var d in debts) {
      d['selected'] = true;
    }
    notifyListeners();
  }

  /// ================= TOTAL =================

  int get totalDebtSelected {
    return debts
        .where((d) => d['selected'] == true)
        .fold(0, (sum, d) => sum + (d['amount'] as int));
  }

  /// ================= LẤY LIST ID =================
  List<int> get selectedChargeIds {
    return debts
        .where((d) => d['selected'] == true)
        .map((d) => d['id'] as int)
        .toList();
  }
}