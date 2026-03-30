import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {

  late AnimationController _controller;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();

    // 🎬 Animation fade logo
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );

    _fadeAnimation =
        CurvedAnimation(parent: _controller, curve: Curves.easeIn);

    _controller.forward();

    // 🚀 gọi auto login
    _initApp();
  }

  Future<void> _initApp() async {
    final auth = context.read<AuthProvider>();

    await Future.delayed(const Duration(milliseconds: 800)); // cho đẹp 😄
    await auth.tryAutoLogin();

    // 👉 KHÔNG cần navigate ở đây
    // GoRouter sẽ tự redirect
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Color(0xFF2196F3),
              Color(0xFF64B5F6),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [

            // 🔥 LOGO
            FadeTransition(
              opacity: _fadeAnimation,
              child: Column(
                children: [
                  Icon(
                    Icons.storefront,
                    size: 80,
                    color: Colors.white,
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    "SaaS Manager",
                    style: TextStyle(
                      fontSize: 26,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      letterSpacing: 1.2,
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 40),

            // ⏳ Loading
            const CircularProgressIndicator(
              color: Colors.white,
            ),

            const SizedBox(height: 16),

            const Text(
              "Đang khởi tạo...",
              style: TextStyle(color: Colors.white70),
            ),
          ],
        ),
      ),
    );
  }
}