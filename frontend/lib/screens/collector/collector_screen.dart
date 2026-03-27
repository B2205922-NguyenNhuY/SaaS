import 'dart:io';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../core/constants/app_colors.dart';
import '../../core/utils/format_utils.dart';
import '../../models/charge_item.dart';
import '../../models/market_item.dart';
import '../../models/zone_item.dart';
import '../../providers/auth_provider.dart';
import '../../providers/collector_provider.dart';

class CollectorScreen extends StatefulWidget {
  const CollectorScreen({super.key});

  @override
  State<CollectorScreen> createState() => _CollectorScreenState();
}

class _CollectorScreenState extends State<CollectorScreen> {
  final TextEditingController _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<CollectorProvider>().init();
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final provider = context.watch<CollectorProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        leading: provider.canGoBack
            ? IconButton(
                icon: const Icon(
                  Icons.arrow_back_ios_new_rounded,
                  size: 20,
                  color: AppColors.textPrimary,
                ),
                onPressed: provider.backStep,
              )
            : null,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              provider.title,
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
            ),
            Row(
              children: [
                Container(
                  width: 6,
                  height: 6,
                  decoration: const BoxDecoration(
                    color: AppColors.success,
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  auth.userName ?? 'Nhân viên',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          _buildSyncButton(provider),
          _buildActionButton(
            icon: Icons.refresh_rounded,
            onPressed: provider.loading
                ? null
                : () => provider.refreshAll(showLoading: true),
          ),
          _buildActionButton(
            icon: Icons.logout_rounded,
            color: AppColors.error,
            onPressed: () => _showLogoutDialog(context),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Column(
        children: [
          if (provider.errorMessage != null &&
              provider.errorMessage!.isNotEmpty)
            _ErrorBanner(message: provider.errorMessage!),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => provider.refreshAll(showLoading: false),
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                children: [
                  const _ShiftDashboard(),
                  const SizedBox(height: 20),
                  _SummaryGrid(provider: provider),
                  const SizedBox(height: 24),
                  _buildContent(provider),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContent(CollectorProvider provider) {
    if (provider.loading &&
        provider.markets.isEmpty &&
        provider.zones.isEmpty &&
        provider.charges.isEmpty) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.only(top: 40),
          child: CircularProgressIndicator(strokeWidth: 3),
        ),
      );
    }

    if (provider.isMarketStep) return _MarketsView(markets: provider.markets);
    if (provider.isZoneStep) return _ZonesView(zones: provider.zones);
    return _ChargesView(searchCtrl: _searchCtrl);
  }

  Widget _buildSyncButton(CollectorProvider provider) {
    return Stack(
      alignment: Alignment.center,
      children: [
        IconButton(
          icon: Icon(
            Icons.cloud_sync_rounded,
            color: provider.pendingReceipts.isNotEmpty
                ? AppColors.warning
                : AppColors.textSecondary,
          ),
          onPressed: provider.syncing ? null : provider.syncPendingReceipts,
        ),
        if (provider.pendingReceipts.isNotEmpty)
          Positioned(
            right: 8,
            top: 8,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: const BoxDecoration(
                color: AppColors.error,
                shape: BoxShape.circle,
              ),
              constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
              child: Text(
                provider.pendingReceipts.length.toString(),
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 9,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    VoidCallback? onPressed,
    Color? color,
  }) {
    return IconButton(
      icon: Icon(
        icon,
        color: color ?? AppColors.textSecondary,
        size: 24,
      ),
      onPressed: onPressed,
    );
  }

  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Đăng xuất?'),
        content: const Text('Bạn có chắc chắn muốn thoát khỏi hệ thống?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await context.read<AuthProvider>().logout();
              if (mounted) Navigator.pushReplacementNamed(context, '/');
            },
            child: const Text(
              'Đăng xuất',
              style: TextStyle(color: AppColors.error),
            ),
          ),
        ],
      ),
    );
  }
}

/// --- DASHBOARD CA LÀM VIỆC ---
class _ShiftDashboard extends StatelessWidget {
  const _ShiftDashboard();

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<CollectorProvider>();
    final shift = provider.activeShift;
    final bool isActive = shift != null;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              color: isActive
                  ? AppColors.success.withOpacity(0.05)
                  : AppColors.warning.withOpacity(0.05),
              child: Row(
                children: [
                  _AnimatedPulseIcon(isActive: isActive),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          isActive
                              ? 'Ca làm việc #${shift.shiftId}'
                              : 'Chưa vào ca',
                          style: GoogleFonts.inter(
                            fontWeight: FontWeight.w800,
                            fontSize: 16,
                          ),
                        ),
                        Text(
                          isActive
                              ? 'Bắt đầu: ${FormatUtils.dateTime(shift.startedAt)}'
                              : 'Vui lòng mở ca để thực hiện thu phí',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (isActive)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.success,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text(
                        'ONLINE',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  if (isActive) ...[
                    Row(
                      children: [
                        _ShiftStatItem(
                          label: 'Tiền mặt',
                          value: FormatUtils.money(shift.cashTotal),
                          icon: Icons.payments_outlined,
                        ),
                        const SizedBox(width: 12),
                        _ShiftStatItem(
                          label: 'Chuyển khoản',
                          value: FormatUtils.money(shift.transferTotal),
                          icon: Icons.account_balance_outlined,
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                  ],
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: provider.loading
                          ? null
                          : () =>
                              _handleShiftToggle(context, provider, isActive),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: isActive
                            ? AppColors.primaryDark
                            : AppColors.primary,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(
                        isActive ? 'KẾT THÚC CA LÀM VIỆC' : 'BẮT ĐẦU CA MỚI',
                        style: GoogleFonts.inter(
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handleShiftToggle(
    BuildContext context,
    CollectorProvider provider,
    bool isActive,
  ) async {
    try {
      if (isActive) {
        await provider.endShift();
      } else {
        await provider.startShift();
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(e.toString().replaceFirst('Exception: ', '')),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }
}

class _AnimatedPulseIcon extends StatelessWidget {
  final bool isActive;
  const _AnimatedPulseIcon({required this.isActive});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(
        color: isActive ? AppColors.success : AppColors.warning,
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: (isActive ? AppColors.success : AppColors.warning)
                .withOpacity(0.3),
            blurRadius: 8,
            spreadRadius: 2,
          ),
        ],
      ),
      child: Icon(
        isActive ? Icons.work_history_rounded : Icons.work_off_rounded,
        color: Colors.white,
        size: 22,
      ),
    );
  }
}

class _ShiftStatItem extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;

  const _ShiftStatItem({
    required this.label,
    required this.value,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: const Color(0xFFF1F5F9),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 14, color: AppColors.textSecondary),
                const SizedBox(width: 4),
                Text(
                  label,
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    color: AppColors.textSecondary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: GoogleFonts.inter(
                fontWeight: FontWeight.w700,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// --- SUMMARY GRID ---
class _SummaryGrid extends StatelessWidget {
  const _SummaryGrid({required this.provider});
  final CollectorProvider provider;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _SummaryCard(
          label: 'Số chợ',
          value: provider.markets.length.toString(),
          icon: Icons.storefront_rounded,
          color: Colors.blue,
        ),
        const SizedBox(width: 12),
        _SummaryCard(
          label: 'Số khu',
          value: provider.zones.length.toString(),
          icon: Icons.grid_view_rounded,
          color: Colors.orange,
        ),
        const SizedBox(width: 12),
        _SummaryCard(
          label: 'Còn nợ',
          value: FormatUtils.money(provider.totalRemaining),
          icon: Icons.account_balance_wallet_rounded,
          color: AppColors.primary,
          isLarge: true,
        ),
      ],
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final bool isLarge;

  const _SummaryCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    this.isLarge = false,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      flex: isLarge ? 2 : 1,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.divider.withOpacity(0.5)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 20, color: color),
            const SizedBox(height: 8),
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                value,
                style: GoogleFonts.inter(
                  fontWeight: FontWeight.w800,
                  fontSize: 16,
                ),
              ),
            ),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 11,
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// --- DANH SÁCH CHỢ ---
class _MarketsView extends StatelessWidget {
  const _MarketsView({required this.markets});
  final List<MarketItem> markets;

  @override
  Widget build(BuildContext context) {
    if (markets.isEmpty) {
      return const _EmptyState(
        icon: Icons.store_outlined,
        message: 'Không tìm thấy chợ nào.',
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionHeader(title: 'Chọn Chợ', count: markets.length),
        ...markets.map(
          (m) => _SelectionTile(
            title: m.name,
            subtitle: m.address.isEmpty ? 'Chưa có địa chỉ' : m.address,
            leadingIcon: Icons.storefront_rounded,
            onTap: () => context.read<CollectorProvider>().selectMarket(m),
          ),
        ),
      ],
    );
  }
}

/// --- DANH SÁCH ZONE ---
class _ZonesView extends StatelessWidget {
  const _ZonesView({required this.zones});
  final List<ZoneItem> zones;

  @override
  Widget build(BuildContext context) {
    if (zones.isEmpty) {
      return const _EmptyState(
        icon: Icons.map_outlined,
        message: 'Chợ này chưa có khu vực.',
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionHeader(title: 'Chọn Khu vực (Zone)', count: zones.length),
        ...zones.map(
          (z) => _SelectionTile(
            title: z.name,
            subtitle: z.status == 'active' ? 'Đang hoạt động' : 'Tạm khóa',
            leadingIcon: Icons.grid_view_rounded,
            onTap: () => context.read<CollectorProvider>().selectZone(z),
          ),
        ),
      ],
    );
  }
}

/// --- DANH SÁCH KHOẢN THU ---
class _ChargesView extends StatelessWidget {
  const _ChargesView({required this.searchCtrl});
  final TextEditingController searchCtrl;

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<CollectorProvider>();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _SectionHeader(
          title: 'Danh sách khoản thu',
          count: provider.charges.length,
        ),
        TextField(
          controller: searchCtrl,
          decoration: InputDecoration(
            hintText: 'Tìm Kiosk hoặc tiểu thương...',
            prefixIcon: const Icon(
              Icons.search_rounded,
              color: AppColors.textSecondary,
            ),
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(vertical: 0),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppColors.divider),
            ),
          ),
          onSubmitted: (v) =>
              context.read<CollectorProvider>().applyFilters(newSearch: v),
        ),
        const SizedBox(height: 12),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _FilterChip(
                label: 'Tất cả',
                selected: provider.statusFilter.isEmpty,
                onTap: () => provider.applyFilters(newStatus: ''),
              ),
              const SizedBox(width: 8),
              _FilterChip(
                label: 'Chưa thu',
                selected: provider.statusFilter == 'chua_thu',
                onTap: () => provider.applyFilters(newStatus: 'chua_thu'),
              ),
              const SizedBox(width: 8),
              _FilterChip(
                label: 'Còn nợ',
                selected: provider.statusFilter == 'no',
                onTap: () => provider.applyFilters(newStatus: 'no'),
              ),
              const SizedBox(width: 8),
              _FilterChip(
                label: 'Đã xong',
                selected: provider.statusFilter == 'da_thu',
                onTap: () => provider.applyFilters(newStatus: 'da_thu'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        if (provider.charges.isEmpty)
          const _EmptyState(
            icon: Icons.receipt_long_outlined,
            message: 'Không có dữ liệu thu phí.',
          )
        else
          ...provider.charges.map((c) => _ChargeCard(charge: c)),
      ],
    );
  }
}

class _ChargeCard extends StatelessWidget {
  const _ChargeCard({required this.charge});
  final ChargeItem charge;

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<CollectorProvider>();
    final bool isPaid = charge.isDone;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color:
              isPaid ? AppColors.success.withOpacity(0.3) : AppColors.divider,
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.vignette_rounded,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      charge.kioskCode.isEmpty
                          ? 'Kiosk #${charge.kioskId}'
                          : charge.kioskCode,
                      style: GoogleFonts.inter(
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                      ),
                    ),
                    Text(
                      charge.merchantName.isEmpty
                          ? 'Ẩn danh'
                          : charge.merchantName,
                      style: GoogleFonts.inter(
                        color: AppColors.textSecondary,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
              _StatusBadge(status: charge.status),
            ],
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Divider(height: 1, thickness: 0.5),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _ChargeDetailInfo(label: 'Kỳ thu', value: charge.periodName),
              _ChargeDetailInfo(
                label: 'Còn lại',
                value: FormatUtils.money(charge.remaining),
                isBold: true,
              ),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            height: 44,
            child: OutlinedButton.icon(
              onPressed:
                  isPaid ? null : () => _showCollectSheet(context, provider),
              icon: Icon(
                isPaid ? Icons.check_circle_rounded : Icons.add_card_rounded,
                size: 18,
              ),
              label: Text(isPaid ? 'ĐÃ THU XONG' : 'THU PHÍ NGAY'),
              style: OutlinedButton.styleFrom(
                side: BorderSide(
                  color: isPaid ? AppColors.success : AppColors.primary,
                ),
                foregroundColor: isPaid ? AppColors.success : AppColors.primary,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showCollectSheet(BuildContext context, CollectorProvider provider) {
    if (!provider.canCollect) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng mở ca làm việc trước!')),
      );
      return;
    }
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _CollectChargeSheet(charge: charge),
    );
  }
}

/// --- COMPONENT NHỎ ---
class _SectionHeader extends StatelessWidget {
  final String title;
  final int count;
  const _SectionHeader({required this.title, required this.count});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12, left: 4),
      child: Row(
        children: [
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: AppColors.divider,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              count.toString(),
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SelectionTile extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData leadingIcon;
  final VoidCallback onTap;

  const _SelectionTile({
    required this.title,
    required this.subtitle,
    required this.leadingIcon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.divider),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        leading: CircleAvatar(
          backgroundColor: AppColors.primary.withOpacity(0.1),
          child: Icon(leadingIcon, color: AppColors.primary, size: 20),
        ),
        title: Text(
          title,
          style: GoogleFonts.inter(fontWeight: FontWeight.w700),
        ),
        subtitle: Text(
          subtitle,
          style: GoogleFonts.inter(
            fontSize: 12,
            color: AppColors.textSecondary,
          ),
        ),
        trailing: const Icon(
          Icons.arrow_forward_ios_rounded,
          size: 14,
          color: AppColors.textHint,
        ),
        onTap: onTap,
      ),
    );
  }
}

class _ChargeDetailInfo extends StatelessWidget {
  final String label;
  final String value;
  final bool isBold;

  const _ChargeDetailInfo({
    required this.label,
    required this.value,
    this.isBold = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 11,
            color: AppColors.textSecondary,
          ),
        ),
        Text(
          value,
          style: GoogleFonts.inter(
            fontWeight: isBold ? FontWeight.w800 : FontWeight.w600,
            fontSize: 14,
          ),
        ),
      ],
    );
  }
}

/// --- SHEET THU PHÍ ---
class _CollectChargeSheet extends StatefulWidget {
  final ChargeItem charge;
  const _CollectChargeSheet({required this.charge});

  @override
  State<_CollectChargeSheet> createState() => _CollectChargeSheetState();
}

class _CollectChargeSheetState extends State<_CollectChargeSheet> {
  late final TextEditingController _amountCtrl;
  final TextEditingController _noteCtrl = TextEditingController();
  final ImagePicker _picker = ImagePicker();

  String _method = 'tien_mat';
  String? _imagePath;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _amountCtrl =
        TextEditingController(text: widget.charge.remaining.toStringAsFixed(0));
  }

  @override
  void dispose() {
    _amountCtrl.dispose();
    _noteCtrl.dispose();
    super.dispose();
  }

  void _changeMethod(String value) {
    setState(() {
      _method = value;
      if (_method != 'chuyen_khoan') {
        _imagePath = null;
      }
    });
  }

  Future<void> _pickTransferImage() async {
    final XFile? file = await _picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
    );

    if (file == null) return;

    setState(() {
      _imagePath = file.path;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: EdgeInsets.fromLTRB(
        20,
        12,
        20,
        MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.divider,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Xác nhận thu phí',
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              '${widget.charge.kioskCode} - ${widget.charge.merchantName}',
              style: const TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _amountCtrl,
              keyboardType: TextInputType.number,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 32,
                fontWeight: FontWeight.w900,
                color: AppColors.primary,
              ),
              decoration: const InputDecoration(
                labelText: 'SỐ TIỀN THU (VNĐ)',
                floatingLabelBehavior: FloatingLabelBehavior.always,
                border: InputBorder.none,
                hintText: '0',
              ),
            ),
            const Divider(),
            const SizedBox(height: 16),
            _buildMethodSelector(),
            const SizedBox(height: 16),
            if (_method == 'chuyen_khoan') ...[
              _buildTransferImagePicker(),
              const SizedBox(height: 16),
            ],
            TextField(
              controller: _noteCtrl,
              decoration: InputDecoration(
                hintText: 'Thêm ghi chú...',
                prefixIcon: const Icon(Icons.notes_rounded),
                filled: true,
                fillColor: const Color(0xFFF1F5F9),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 54,
              child: ElevatedButton(
                onPressed: _submitting ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  elevation: 0,
                ),
                child: _submitting
                    ? const SizedBox(
                        width: 22,
                        height: 22,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2.4,
                        ),
                      )
                    : const Text(
                        'XÁC NHẬN GIAO DỊCH',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                          color: Colors.white,
                        ),
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMethodSelector() {
    return Row(
      children: [
        _MethodBtn(
          label: 'Tiền mặt',
          icon: Icons.payments_rounded,
          selected: _method == 'tien_mat',
          onTap: () => _changeMethod('tien_mat'),
        ),
        const SizedBox(width: 12),
        _MethodBtn(
          label: 'Chuyển khoản',
          icon: Icons.account_balance_rounded,
          selected: _method == 'chuyen_khoan',
          onTap: () => _changeMethod('chuyen_khoan'),
        ),
      ],
    );
  }

  Widget _buildTransferImagePicker() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Ảnh xác nhận chuyển khoản',
          style: GoogleFonts.inter(
            fontSize: 13,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 10),
        InkWell(
          onTap: _pickTransferImage,
          borderRadius: BorderRadius.circular(14),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.divider),
            ),
            child: _imagePath == null
                ? Row(
                    children: const [
                      Icon(Icons.photo_library_rounded),
                      SizedBox(width: 10),
                      Expanded(
                        child: Text('Chọn ảnh từ thư viện'),
                      ),
                    ],
                  )
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.file(
                          File(_imagePath!),
                          height: 180,
                          width: double.infinity,
                          fit: BoxFit.cover,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          const Icon(
                            Icons.check_circle,
                            color: AppColors.success,
                            size: 18,
                          ),
                          const SizedBox(width: 6),
                          const Expanded(
                            child: Text('Đã chọn ảnh xác nhận'),
                          ),
                          TextButton(
                            onPressed: _pickTransferImage,
                            child: const Text('Đổi ảnh'),
                          ),
                        ],
                      ),
                    ],
                  ),
          ),
        ),
      ],
    );
  }

  Future<void> _submit() async {
    final amount = num.tryParse(_amountCtrl.text);
    if (amount == null || amount <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Số tiền thu không hợp lệ.')),
      );
      return;
    }

    if (_method == 'chuyen_khoan' &&
        (_imagePath == null || _imagePath!.trim().isEmpty)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng chọn ảnh xác nhận chuyển khoản.'),
        ),
      );
      return;
    }

    setState(() => _submitting = true);
    try {
      final mode = await context.read<CollectorProvider>().collectCharge(
            charge: widget.charge,
            amount: amount,
            paymentMethod: _method,
            note: _noteCtrl.text.trim(),
            imagePath: _imagePath,
          );

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              mode == 'online'
                  ? 'Đã thu phí thành công!'
                  : 'Đã lưu offline (mất mạng)',
            ),
            backgroundColor: AppColors.success,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
      );
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }
}

class _MethodBtn extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  const _MethodBtn({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: selected ? AppColors.primary.withOpacity(0.1) : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: selected ? AppColors.primary : AppColors.divider,
            ),
          ),
          child: Column(
            children: [
              Icon(
                icon,
                color: selected ? AppColors.primary : AppColors.textSecondary,
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: selected ? FontWeight.bold : FontWeight.normal,
                  color: selected ? AppColors.primary : AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// --- HELPER WIDGETS ---
class _StatusBadge extends StatelessWidget {
  final String status;
  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    Color color;
    String text;

    switch (status) {
      case 'da_thu':
        color = AppColors.success;
        text = 'Đã xong';
        break;
      case 'no':
        color = AppColors.error;
        text = 'Còn nợ';
        break;
      default:
        color = AppColors.warning;
        text = 'Chờ thu';
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return FilterChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onTap(),
      backgroundColor: Colors.white,
      selectedColor: AppColors.primary.withOpacity(0.15),
      checkmarkColor: AppColors.primary,
      labelStyle: TextStyle(
        color: selected ? AppColors.primaryDark : AppColors.textSecondary,
        fontWeight: selected ? FontWeight.bold : FontWeight.normal,
        fontSize: 13,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(
          color: selected ? AppColors.primary : AppColors.divider,
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String message;

  const _EmptyState({
    required this.icon,
    required this.message,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 40),
        child: Column(
          children: [
            Icon(
              icon,
              size: 60,
              color: AppColors.textHint.withOpacity(0.5),
            ),
            const SizedBox(height: 12),
            Text(
              message,
              style: const TextStyle(color: AppColors.textSecondary),
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  final String message;
  const _ErrorBanner({required this.message});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      color: AppColors.error.withOpacity(0.1),
      child: Row(
        children: [
          const Icon(
            Icons.error_outline_rounded,
            color: AppColors.error,
            size: 20,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(
                color: AppColors.error,
                fontSize: 13,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
