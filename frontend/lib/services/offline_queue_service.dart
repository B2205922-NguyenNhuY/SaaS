import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class OfflineQueueService {
  static const _key = 'collector_pending_receipts';

  Future<List<Map<String, dynamic>>> getPendingReceipts() async {
    final prefs = await SharedPreferences.getInstance();
    final list = prefs.getStringList(_key) ?? [];
    return list.map((e) => jsonDecode(e) as Map<String, dynamic>).toList();
  }

  Future<void> enqueueReceipt(Map<String, dynamic> payload) async {
    final prefs = await SharedPreferences.getInstance();
    final list = prefs.getStringList(_key) ?? [];
    list.add(jsonEncode(payload));
    await prefs.setStringList(_key, list);
  }

  Future<void> removeReceiptByLocalId(String localId) async {
    final prefs = await SharedPreferences.getInstance();
    final list = prefs.getStringList(_key) ?? [];
    list.removeWhere((item) {
      final decoded = jsonDecode(item) as Map<String, dynamic>;
      return decoded['local_id'] == localId;
    });
    await prefs.setStringList(_key, list);
  }
}
