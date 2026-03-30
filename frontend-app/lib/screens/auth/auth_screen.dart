import 'package:flutter/material.dart';
import 'auth_card.dart';
import 'app_banner.dart';

class AuthScreen extends StatelessWidget {
  const AuthScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [

                // 🔥 Banner nhỏ (logo + title)
                const AppBanner(),

                const SizedBox(height: 30),

                // 🟩 Login form
                AuthCard(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}