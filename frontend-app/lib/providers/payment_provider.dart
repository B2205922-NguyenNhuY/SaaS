import 'package:flutter/material.dart';
import '../core/services/api_services.dart';

class PaymentProvider with ChangeNotifier {
  final api = ApiService();

  bool isLoading = false;

  List<Map<String, dynamic>> receipts = [];
  Map<int, List<Map<String, dynamic>>> receiptDetails = {};

  String filter = "all"; // all | tien_mat | chuyen_khoan

  Map<String, dynamic>? lastPayment;
  bool isLoadingLastPayment = false;

  

  // ===== FETCH RECEIPTS =====
  Future<void> fetchReceipts() async {
    isLoading = true;
    notifyListeners();

    try {
      final res = await api.get('/receipts/me');
      final data = res['data'] as List;
      
      receipts = data.map((r) {
        return {
          "id": r['receipt_id'],
          "amount": double.tryParse(r['soTienThu'].toString()) ?? 0,
          "method": r['hinhThucThanhToan'] == 'chuyen_khoan' 
              ? 'Chuyển khoản' 
              : 'Tiền mặt',
          "date": r['created_at'],
        };
      }).toList();
    } catch (e) {
      receipts = [];
    }

    isLoading = false;
    notifyListeners();
  }

  // ===== FETCH DETAIL =====
  Future<void> fetchReceiptDetail(int receiptId) async {
    if (receiptDetails.containsKey(receiptId)) return;

    try {
      final res = await api.get('/receipt_charges/receipt/$receiptId');
      final data = res as List;

      receiptDetails[receiptId] = data.map((c) {
        return {
          "kiosk": c['maKiosk'],
          "period": c['tenKyThu'],
          "amount": c['soTienDaTra'],
          "price": c['soTienPhaiThu'],
          "totalPaid": c['soTienDaThu']
        };
      }).toList();

      notifyListeners();
    } catch (e) {
      receiptDetails[receiptId] = [];
    }
  }
  
  // ===== FILTER =====
  List<Map<String, dynamic>> get filteredReceipts {
    if (filter == "all") return receipts;
    print("filter: $filter");
    print("receipts: $receipts");
    return receipts
        .where((r) => r['method'] == filter)
        .toList();
  }

  void setFilter(String value) {
    filter = value;
    notifyListeners();
  }
}