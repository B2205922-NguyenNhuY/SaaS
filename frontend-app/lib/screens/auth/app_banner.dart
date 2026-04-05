import 'package:flutter/material.dart';

class AppBanner extends StatelessWidget {
  const AppBanner({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [

        // 🔥 Logo
        Image.asset(
          'assets/images/logoApp.png',
          width: 70,
          fit: BoxFit.contain,
        ),

        const SizedBox(height: 10),

        // 🧾 Tên app
        const Text(
          "MARKET HUB",
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.bold,
          ),
        ),

        const SizedBox(height: 5),

        const Text(
          "Quản lý thu phí chợ",
          style: TextStyle(color: Colors.grey),
        ),
      ],
    );
  }
}