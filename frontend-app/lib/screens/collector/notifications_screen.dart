import 'package:flutter/material.dart';

import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/format_utils.dart';
import '../../models/notification_item.dart';
import '../../services/collector_service.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final CollectorService _service = CollectorService();
  List<NotificationItem> _items = const [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await _service.getNotifications();
      setState(() => _items = data);
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _open(NotificationItem item) async {
    await _service.markNotificationRead(item.notificationId);
    final detail = await _service.getNotificationDetail(item.notificationId);
    if (!mounted) return;
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(detail.title),
        content: SingleChildScrollView(
          child: Text(detail.content),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Đóng'),
          ),
        ],
      ),
    );
    _load();
  }

  @override
  Widget build(BuildContext context) {
    final unread = _items.where((e) => !e.isRead).length;
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Thông báo hệ thống'),
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                  color: Colors.white, borderRadius: BorderRadius.circular(16)),
              child: Text('Chưa đọc: $unread thông báo'),
            ),
            const SizedBox(height: 16),
            if (_error != null)
              Text(_error!, style: const TextStyle(color: AppColors.error)),
            if (_loading)
              const Padding(
                padding: EdgeInsets.only(top: 40),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_items.isEmpty)
              const Card(
                  child: Padding(
                      padding: EdgeInsets.all(20),
                      child: Text('Không có thông báo nào.')))
            else
              ..._items.map(
                (item) => Card(
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: item.isRead
                          ? Colors.grey.shade200
                          : AppColors.primary.withOpacity(0.12),
                      child: Icon(item.isRead
                          ? Icons.mark_email_read_rounded
                          : Icons.notifications_active_rounded),
                    ),
                    title: Text(item.title),
                    subtitle: Text(FormatUtils.dateTime(item.createdAt)),
                    trailing: item.isRead
                        ? null
                        : const Icon(Icons.brightness_1,
                            color: AppColors.primary, size: 10),
                    onTap: () => _open(item),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
