import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/kiosk_provider.dart';
import '../../core/utils/ui_helpers.dart';

class KioskDetailScreen extends StatefulWidget {
  final int kioskId;

  const KioskDetailScreen({super.key, required this.kioskId});

  @override
  State<KioskDetailScreen> createState() => _KioskDetailScreenState();
}

class _KioskDetailScreenState extends State<KioskDetailScreen> {

  @override
  void initState() {
    super.initState();

    Future.microtask(() {
      context.read<KioskProvider>().fetchKioskDetail(widget.kioskId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<KioskProvider>();

    if (provider.isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final kiosk = provider.kiosk;
    final fee = provider.fee;

    if (kiosk == null) {
      return const Scaffold(
        body: Center(child: Text("Không có dữ liệu")),
      );
    }

    return Scaffold(
      appBar: AppBar(title: Text(kiosk['maKiosk'] ?? "")),

      body: Padding(
        padding: const EdgeInsets.all(16),
        child: ListView(
          children: [

            /// ===== THÔNG TIN KIOSK =====
            const Text(
              "THÔNG TIN KIOSK",
              style: TextStyle(fontWeight: FontWeight.bold),
            ),

            const SizedBox(height: 10),

            UIHelpers.row("Mã kiosk", kiosk['maKiosk']),
            UIHelpers.row("Vị trí", kiosk['viTri']),
            UIHelpers.row("Diện tích", "${kiosk['dienTich']} m²"),
            UIHelpers.row("Khu", kiosk['tenKhu']),
            UIHelpers.row("Chợ", kiosk['tenCho']),
            UIHelpers.row("Loại", kiosk['tenLoai']),
            UIHelpers.row("Trạng thái", kiosk['trangThai']),

            const SizedBox(height: 20),

            /// ===== BIỂU PHÍ =====
            const Text(
              "BIỂU PHÍ HIỆN TẠI",
              style: TextStyle(fontWeight: FontWeight.bold),
            ),

            const SizedBox(height: 10),

            if (fee == null)
              const Text("Chưa có biểu phí")
            else ...[
              UIHelpers.row("Tên phí", fee['tenPhi']),
              UIHelpers.row(
                "Đơn giá",
                "${UIHelpers.formatMoney(fee['donGia'])} đ",
              ),
              UIHelpers.row("Hình thức", fee['hinhThuc']),
              UIHelpers.row("Giảm giá", "${fee['mucMienGiam']} %"),
            ],
          ],
        ),
      ),
    );
  }
}