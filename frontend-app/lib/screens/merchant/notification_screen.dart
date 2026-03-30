import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../providers/notification_provider.dart';
import '../../core/utils/ui_helpers.dart';

class NotificationScreen extends StatefulWidget {
  const NotificationScreen({super.key});

  @override
  State<NotificationScreen> createState() =>
      _NotificationScreenState();
}

class _NotificationScreenState extends State<NotificationScreen> {

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      context.read<NotificationProvider>().fetchNotifications();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<NotificationProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text("Thông báo")),

      body: provider.isLoading
          ? const Center(child: CircularProgressIndicator())
          : provider.notifications.isEmpty
              ? const Center(child: Text("Không có thông báo"))
              : ListView.builder(
                  itemCount: provider.notifications.length,
                  itemBuilder: (context, index) {
                    final n = provider.notifications[index];
                    return _item(context, n);
                  },
                ),
    );
  }

  Widget _item(BuildContext context, Map<String, dynamic> n) {
    final isRead = n['is_read'] == 1;

    return GestureDetector(
      onTap: () async {
        final provider = context.read<NotificationProvider>();

        /// 🔥 mark read
        await provider.markRead(n['notification_id'], n['tenant_id']);

        /// 🔥 chuyển màn
        context.push('/debt-select');
      },

      child: Container(
        padding: const EdgeInsets.all(12),
        margin: const EdgeInsets.symmetric(
            horizontal: 12, vertical: 6),

        decoration: BoxDecoration(
          color: isRead
              ? Colors.grey.shade100 // 👈 đã đọc
              : Colors.white,        // 👈 chưa đọc
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade200),
        ),

        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [

            /// 🔴 title
            Row(
              children: [
                Expanded(
                  child: Text(
                    n['title'],
                    style: TextStyle(
                      fontWeight: isRead
                          ? FontWeight.normal
                          : FontWeight.bold,
                    ),
                  ),
                ),

                if (!isRead)
                  const Icon(Icons.circle,
                      size: 10, color: Colors.red),
              ],
            ),

            const SizedBox(height: 6),

            /// 📄 content
            Text(n['content']),

            const SizedBox(height: 6),

            /// 🕒 time
            Text(
              UIHelpers.formatDate(n['created_at']),
              style: const TextStyle(
                fontSize: 12,
                color: Colors.grey,
              ),
            ),
          ],
        ),
      ),
    );
  }
}