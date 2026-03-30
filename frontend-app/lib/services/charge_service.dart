class ChargeService {
  final String baseUrl = "http://localhost:3000";

  // 🔹 Merchant
  Future<List<dynamic>> getMyCharges(String token) async {
    // GET /charges/me
  }

  // 🔹 Collector
  Future<List<dynamic>> getCollectorCharges(String token) async {
    // GET /collector/charges
  }

  // 🔹 Detail (dùng chung)
  Future<dynamic> getChargeDetail(int id, String token) async {
    // GET /charges/:id
  }

  // 🔹 Collector thu tiền
  Future<void> collect(int id, double amount, String token) async {
    // POST /:id/receipts
  }

  // 🔹 Merchant trả tiền (nếu có)
  Future<void> pay(int id, double amount, String token) async {
    // POST /charges/:id/pay
  }
}