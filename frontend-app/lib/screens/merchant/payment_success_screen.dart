import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class PaymentSuccessScreen extends StatelessWidget {
  const PaymentSuccessScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [

              /// ✅ ICON
              const Icon(
                Icons.check_circle,
                color: Colors.green,
                size: 100,
              ),

              const SizedBox(height: 20),

              /// ✅ TITLE
              const Text(
                "Thanh toán thành công",
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),

              const SizedBox(height: 10),

              /// 📄 DESC
              const Text(
                "Giao dịch của bạn đã được xử lý thành công.",
                textAlign: TextAlign.center,
              ),

              const SizedBox(height: 30),

              /// 🔘 BUTTON
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    /// 🔥 quay về home và clear stack
                    context.go('/merchant');
                  },
                  child: const Text("Về trang chủ"),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}