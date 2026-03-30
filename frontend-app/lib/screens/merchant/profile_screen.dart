import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../providers/merchant_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/kiosk_provider.dart';
import '../../core/utils/ui_helpers.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      context.read<MerchantProvider>().fetchProfile();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<MerchantProvider>();
    final profile = provider.profile;

    if (profile == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final assignments = profile['active_assignments'] as List? ?? [];

    return Scaffold(
      appBar: AppBar(title: const Text("Tài khoản")),

      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [

          /// 👤 ICON
          const Center(
            child: CircleAvatar(
              radius: 40,
              child: Icon(Icons.person, size: 40),
            ),
          ),

          const SizedBox(height: 16),

          /// ===== THÔNG TIN CÁ NHÂN =====
          const Text("THÔNG TIN CÁ NHÂN",
              style: TextStyle(fontWeight: FontWeight.bold)),

          const SizedBox(height: 10),

            _row("Họ tên", profile['hoTen']),
            _row("SĐT", profile['soDienThoai']),
            _row("CCCD", profile['CCCD']),
            _row("Mã số thuế", profile['maSoThue']),
            _row("Địa chỉ", profile['diaChiThuongTru']),
            _row("Ngày tham gia",  UIHelpers.formatDate(profile['ngayThamGiaKinhDoanh'])),

            const SizedBox(height: 8),

            Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                    const Text("Trạng thái"),
                    statusChip(profile['trangThai'] ?? ''),
                ],
            ),

          const SizedBox(height: 20),

          /// ===== KIOSK =====
          const Text("KIOSK ĐANG THUÊ",
              style: TextStyle(fontWeight: FontWeight.bold)),

          const SizedBox(height: 10),

          if (assignments.isEmpty)
            const Text("Không có kiosk nào")
          else
            ...assignments.map((a) => _kioskItem(a)).toList(),

          const SizedBox(height: 80),
     ], // ✅ nhớ đóng children
  ), // ✅ nhớ đóng ListView

           bottomNavigationBar: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [

                    /// ✏️ EDIT
                    SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                            onPressed: () {
                                context.push('/edit-profile');
                            },
                            icon: const Icon(Icons.edit),
                            label: const Text("Chỉnh sửa thông tin"),
                        ),
                    ),

                    const SizedBox(height: 10),

                    /// 🚪 LOGOUT
                    SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                            onPressed: () => _confirmLogout(context),
                            icon: const Icon(Icons.logout),
                            label: const Text("Đăng xuất"),
                            style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.red,
                            ),
                        ),
                    ),
                ],
            ),
      ),
    );
  }

  // ===== ROW =====
  Widget _row(String title, dynamic value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title),
          Flexible(
            child: Text(
              value?.toString() ?? "",
              textAlign: TextAlign.right,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }

  // ===== KIOSK ITEM =====
  Widget _kioskItem(Map<String, dynamic> a) {
    final provider = context.watch<KioskProvider>();
    final kioskId = (a['kiosk_id'] as num).toInt();

    final fee = provider.kioskFees[kioskId];
    print("$fee");
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: const [
          BoxShadow(color: Colors.black12, blurRadius: 6)
        ],
      ),
      child: ExpansionTile(
        onExpansionChanged: (expanded) {
          if (expanded) {
            provider.fetchKioskFee(a);
          }
        },

        title: Text(
          a['maKiosk'],
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),

        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("📍 ${a['viTri']}"),
            Text("🏢 ${a['tenKhu']}"),
            Text("🛒 ${a['tenCho']}"),
          ],
        ),

        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: _buildFeeSection(fee),
          )
        ],
      ),
    );
  }

  Widget _buildFeeSection(Map<String, dynamic>? fee) {
    if (fee == null) {
      return const Center(child: CircularProgressIndicator());
    }

    if (fee.isEmpty) {
      return const Text("Chưa có biểu phí");
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "📊 Biểu phí hiện tại",
          style: TextStyle(fontWeight: FontWeight.bold),
        ),

        const SizedBox(height: 8),

        _row("Tên", fee['tenBieuPhi']),
        _row("Đơn giá", "${UIHelpers.formatMoney(fee['donGia'])} đ"),
        _row("Hình thức", fee['hinhThuc'] == 'ngay' ? 'Ngày' : 'Tháng',),
        _row("Miễn giảm", "${fee['mucMienGiam']}%"),
        _row("Ngày áp dụng", UIHelpers.formatDate(fee['ngayApDung'])),
      ],
    );
  }

  Widget statusChip(String status) {
    Color color;

    switch (status) {
      case 'active':
        color = Colors.green;
        break;
      case 'inactive':
        color = Colors.red;
        break;
      default:
        color = Colors.grey;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

/// ===== LOGOUT DIALOG =====
void _confirmLogout(BuildContext context) {
  showDialog(
    context: context,
    builder: (_) => AlertDialog(
      title: const Text("Đăng xuất"),
      content: const Text("Bạn có chắc muốn đăng xuất không?"),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text("Hủy"),
        ),
        ElevatedButton(
          onPressed: () {
            Navigator.pop(context);

            context.read<AuthProvider>().logout();

            Navigator.pushNamedAndRemoveUntil(
              context,
              '/auth',
              (route) => false,
            );
          },
          child: const Text("Đăng xuất"),
        ),
      ],
    ),
  );
}

