import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import 'package:provider/provider.dart';

class CollectorDrawer extends StatelessWidget {
  const CollectorDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: Column(
        children: [

          // 🔷 HEADER
          DrawerHeader(
            decoration: const BoxDecoration(
                color: Colors.blue,
            ),
            child: Align(
                alignment: Alignment.bottomLeft,
                child: Consumer<AuthProvider>(
                builder: (context, auth, _) {
                    return Row(
                    children: [
                        const Icon(Icons.person, color: Colors.white, size: 40),
                        const SizedBox(width: 10),

                        Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                            // 👤 NAME
                            Text(
                            auth.name ?? "Collector",
                            style: const TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                            ),
                            ),

                            const SizedBox(height: 5),

                            // 📧 EMAIL
                            Text(
                            auth.email ?? "email@example.com",
                            style: const TextStyle(
                                color: Colors.white70,
                                fontSize: 13,
                            ),
                            ),
                        ],
                        ),
                    ],
                    );
                },
                ),
            ),
            ),

          // 🏠 HOME / SHIFT
          ListTile(
            leading: const Icon(Icons.home),
            title: const Text("Trang chính"),
            onTap: () => context.push('/collector'),
          ),

          ListTile(
            leading: const Icon(Icons.work),
            title: const Text("Ca làm việc"),
            onTap: () => context.push('/collector/shift'),
          ),

          // 💰 CHARGES
          ListTile(
            leading: const Icon(Icons.list_alt),
            title: const Text("Danh sách cần thu"),
            onTap: () => context.push('/collector/charges'),
          ),

          // 📊 HISTORY (optional nâng cao)
          ListTile(
            leading: const Icon(Icons.history),
            title: const Text("Lịch sử thu"),
            onTap: () => context.push('/collector/history'),
          ),

          const Spacer(),

          const Divider(),

          // 🚪 LOGOUT
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.red),
            title: const Text("Đăng xuất"),
            onTap: () => context.go('/logout'),
          ),
        ],
      ),
    );
  }
}