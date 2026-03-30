import 'package:flutter/material.dart';

class KioskCard extends StatelessWidget {
  final Map<String, dynamic> kiosk;
  final VoidCallback? onTap;

  const KioskCard({
    super.key,
    required this.kiosk,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Card(
        margin: const EdgeInsets.symmetric(vertical: 8),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        elevation: 3,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              // Icon
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.store, color: Colors.blue),
              ),

              const SizedBox(width: 12),

              // Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      kiosk['maKiosk'] ?? 'Kiosk',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text("📍 ${kiosk['viTri']}"),
                    Text("🏬 ${kiosk['tenCho']} - ${kiosk['tenKhu']}"),
                    Text("📦 ${kiosk['tenLoai']}"),
                  ],
                ),
              ),

              // Status
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.green,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  "Đang thuê",
                  style: TextStyle(color: Colors.white, fontSize: 12),
                ),
              )
            ],
          ),
        ),
      ),
    );
  }
}