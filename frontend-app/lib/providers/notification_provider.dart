import 'package:flutter/material.dart';
import '../core/services/api_services.dart';

class NotificationProvider with ChangeNotifier {
  final api = ApiService();

  List<Map<String, dynamic>> notifications = [];
  bool isLoading = false;

  /// 🔥 fetch
  Future<void> fetchNotifications() async {
    isLoading = true;
    notifyListeners();

    try {
      final res = await api.get('/notifications/me');

      final data = res is List ? res : res['data'];

      notifications = List<Map<String, dynamic>>.from(data);
    } catch (e) {
      notifications = [];
    }

    isLoading = false;
    notifyListeners();
  }

  /// 🔥 unread count
  int get unreadCount {
    return notifications.where((n) => n['is_read'] == 0).length;
  }

  /// 🔥 mark read
  Future<void> markRead(int id, int tenant_id) async {
    try {
        print("call markRead");
      await api.post('/notifications/$id/read', data: {'tenant_id': tenant_id});
      final index =
          notifications.indexWhere((n) => n['notification_id'] == id);
        print("index: $index");
      if (index != -1) {
        notifications[index]['is_read'] = 1;
        notifyListeners();
      }
    } catch (e) {}
  }
}