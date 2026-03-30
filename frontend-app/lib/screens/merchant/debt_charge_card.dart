import 'package:flutter/material.dart';
import '../../core/utils/ui_helpers.dart';


class DebtCard extends StatelessWidget {
  final Map<String, dynamic> d;
  final bool enabled;
  final VoidCallback onTap;

  const DebtCard({
    super.key,
    required this.d,
    required this.enabled,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: enabled ? 1 : 0.5,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: Row(
          children: [

            Checkbox(
              value: d['selected'],
              onChanged: enabled ? (_) => onTap() : null,
            ),

            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(d['kiosk'],
                      style: const TextStyle(fontWeight: FontWeight.bold)),
                  Text(d['zone'], style: const TextStyle(color: Colors.grey)),
                  Text(d['period'], style: const TextStyle(color: Colors.grey)),
                ],
              ),
            ),

            Text(
              "${UIHelpers.formatMoney(d['amount'])} đ",
              style: const TextStyle(
                color: Colors.red,
                fontWeight: FontWeight.bold,
              ),
            )
          ],
        ),
      ),
    );
  }
}