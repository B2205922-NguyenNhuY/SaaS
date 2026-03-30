import 'package:flutter/material.dart';

class PendingChargeList extends StatelessWidget {
  final List charges;

  const PendingChargeList({super.key, required this.charges});

  @override
  Widget build(BuildContext context) {
    if (charges.isEmpty) {
      return const Center(child: Text("Không có khoản cần thanh toán 🎉"));
    }

    return Column(
      children: charges.map((c) {
        final isDebt = c['status'] == 'no';

        return Card(
          child: ListTile(
            leading: Icon(
              isDebt ? Icons.error : Icons.warning,
              color: isDebt ? Colors.red : Colors.orange,
            ),

            title: Text(c['kiosk']),

            subtitle: Text("Kỳ: ${c['period']}"),

            trailing: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  "${_formatMoney(c['amount'])} đ",
                  style: TextStyle(
                    color: isDebt ? Colors.red : Colors.orange,
                    fontWeight: FontWeight.bold,
                  ),
                ),

                const SizedBox(height: 4),

                Text(
                  isDebt ? "Quá hạn" : "Chưa thanh toán",
                  style: TextStyle(
                    fontSize: 12,
                    color: isDebt ? Colors.red : Colors.orange,
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  String _formatMoney(int amount) {
    return amount.toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (m) => '${m[1]}.',
    );
  }
}