import 'package:flutter/material.dart';

class UIHelpers {

  // ===== ROW TEXT =====
  static Widget row(String title, dynamic value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title),
          Text(
            value?.toString() ?? "-",
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }

  // ===== FORMAT MONEY =====
  static String formatMoney(dynamic amount) {
    final num value = num.tryParse(amount.toString()) ?? 0;

    return value.toStringAsFixed(0).replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]}.',
    );
  }

  // ===== FORMAT DATE FROM ISO =====
  static String formatDate(String? iso) {
    if (iso == null) return "";
    final date = DateTime.tryParse(iso);
    if (date == null) return "";

    return formatDateFromDateTime(date);
  }

  // ===== FORMAT DATE FROM DATETIME =====
  static String formatDateFromDateTime(DateTime date) {
    return "${date.day.toString().padLeft(2, '0')}/"
           "${date.month.toString().padLeft(2, '0')}/"
           "${date.year}";
  }

  static String formatDateForApi(DateTime date) {
    return "${date.year}-"
            "${date.month.toString().padLeft(2, '0')}-"
            "${date.day.toString().padLeft(2, '0')}";
    }

  static Widget statusBadge({
    required String text,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}