import 'package:flutter/material.dart';

class LastPaymentCard extends StatelessWidget {
  final Map<String, dynamic>? data;

  const LastPaymentCard({super.key, this.data});

  @override
  Widget build(BuildContext context) {
    return data == null ? _buildEmpty() : _buildContent();
  }

  // ===== MAIN CONTENT (1 LINE) =====
  Widget _buildContent() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: _cardDecoration(),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // LEFT
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                "Lần nộp gần nhất",
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
              const SizedBox(height: 4),
              Text(
                _formatMoneySafe(data?['amount']) + " đ",
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
            ],
          ),

          // RIGHT
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                _formatDateSafe(data?['date']),
                style: const TextStyle(fontSize: 13),
              ),
              const SizedBox(height: 4),
              Text(
                _formatMethod(data?['method']),
                style: const TextStyle(
                  fontSize: 12,
                  color: Colors.grey,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ===== EMPTY =====
  Widget _buildEmpty() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: _cardDecoration(color: Colors.grey.shade100),
      child: const Center(
        child: Text("Chưa có giao dịch nào"),
      ),
    );
  }

  // ===== DECORATION (CHỈ BO GÓC DƯỚI) =====
  BoxDecoration _cardDecoration({Color? color}) {
    return BoxDecoration(
      color: color ?? Colors.white,
      borderRadius: const BorderRadius.only(
        bottomLeft: Radius.circular(20),
        bottomRight: Radius.circular(20),
      ),
      boxShadow: const [
        BoxShadow(color: Colors.black12, blurRadius: 8),
      ],
    );
  }

  // ===== FORMAT MONEY =====
  String _formatMoneySafe(dynamic value) {
    final numVal = double.tryParse(value.toString()) ?? 0;

    return numVal.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (m) => '${m[1]}.',
    );
  }

  // ===== FORMAT DATE =====
  String _formatDateSafe(dynamic iso) {
    if (iso == null) return "";

    final date = DateTime.tryParse(iso.toString());
    if (date == null) return iso.toString();

    return "${date.day.toString().padLeft(2, '0')}/"
        "${date.month.toString().padLeft(2, '0')}/"
        "${date.year}";
  }

  // ===== FORMAT METHOD =====
  String _formatMethod(dynamic method) {
    if (method == "chuyen_khoan") return "Chuyển khoản";
    if (method == "tien_mat") return "Tiền mặt";
    if (method == "momo") return "MoMo";
    return method?.toString() ?? "";
  }
}