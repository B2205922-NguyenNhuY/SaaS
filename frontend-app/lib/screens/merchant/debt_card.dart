import 'package:flutter/material.dart';

class DebtCard extends StatelessWidget {
  final int totalDebt;
  final VoidCallback? onPay;

  const DebtCard({
    super.key,
    required this.totalDebt,
    this.onPay,
  });

  @override
  Widget build(BuildContext context) {
    final isZero = totalDebt == 0;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isZero
              ? [Colors.blue, Colors.blueAccent]
              : [Colors.red, Colors.orange],
        ),
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [

          /// 💰 TITLE
          const Text(
            "Tổng công nợ",
            style: TextStyle(color: Colors.white70),
          ),

          const SizedBox(height: 8),

          /// 💸 AMOUNT
          Text(
            isZero ? "0 đ 🎉" : "${_formatMoney(totalDebt)} đ",
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),

          const SizedBox(height: 16),

          /// 🚀 BUTTON
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: isZero ? null : onPay,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: isZero ? Colors.grey : Colors.red,
              ),
              child: Text(
                isZero ? "Không có nợ" : "Thanh toán ngay",
              ),
            ),
          ),
        ],
      ),
    );
  }

  /// 💵 FORMAT TIỀN
  String _formatMoney(int amount) {
    return amount.toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]}.',
    );
  }
}