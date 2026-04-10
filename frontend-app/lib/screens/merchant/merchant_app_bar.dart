import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/notification_provider.dart';

class MerchantAppBar extends StatelessWidget
    implements PreferredSizeWidget {
  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  const MerchantAppBar({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return AppBar(
      elevation: 0,
      backgroundColor: Colors.white,
      foregroundColor: Colors.black,
      titleSpacing: 0,

      title: Row(
        children: [
          const SizedBox(width: 12),

          CircleAvatar(
            radius: 18,
            backgroundColor: Colors.blue,
            child: Text(
              (auth.name ?? "U")[0].toUpperCase(),
              style: const TextStyle(color: Colors.white),
            ),
          ),

          const SizedBox(width: 10),

          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                auth.name ?? "Merchant",
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Text(
                "Xin chào 👋",
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
            ],
          ),
        ],
      ),

      actions: [

        /// 🔔 NOTIFICATION + BADGE
        Consumer<NotificationProvider>(
          builder: (_, p, __) {
            return Stack(
              children: [
                IconButton(
                  icon: const Icon(Icons.notifications_none),
                  onPressed: () {
                    context.push('/notifications');
                  },
                ),

                /// 🔴 badge
                if (p.unreadCount > 0)
                  Positioned(
                    right: 10,
                    top: 10,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: Colors.red,
                        shape: BoxShape.circle,
                      ),
                      child: Text(
                        p.unreadCount > 9
                            ? "9+"
                            : p.unreadCount.toString(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                        ),
                      ),
                    ),
                  ),
              ],
            );
          },
        ),

        

        const SizedBox(width: 8),
      ],
    );
  }
}