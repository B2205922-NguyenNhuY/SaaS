import 'package:flutter/material.dart';

import '../../core/constants/app_colors.dart';
import '../../core/utils/format_utils.dart';
import '../../models/merchant_detail.dart';
import '../../models/receipt_item.dart';
import '../../services/collector_service.dart';

class MerchantDetailScreen extends StatefulWidget {
  const MerchantDetailScreen({super.key, required this.merchantId});

  final int merchantId;

  @override
  State<MerchantDetailScreen> createState() => _MerchantDetailScreenState();
}

class _MerchantDetailScreenState extends State<MerchantDetailScreen> {
  final CollectorService _service = CollectorService();
  MerchantDetail? _merchant;
  List<ReceiptItem> _payments = const [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final merchant = await _service.getMerchantDetail(widget.merchantId);
      final receipts = await _service.getReceipts(query: merchant.name);
      setState(() {
        _merchant = merchant;
        _payments = receipts;
      });
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Chi tiết tiểu thương'),
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : _merchant == null
                  ? const Center(child: Text('Không tìm thấy tiểu thương'))
                  : ListView(
                      padding: const EdgeInsets.all(16),
                      children: [
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.divider),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(_merchant!.name,
                                  style: const TextStyle(
                                      fontSize: 22,
                                      fontWeight: FontWeight.w800)),
                              const SizedBox(height: 8),
                              _line('SĐT', _merchant!.phone ?? '--'),
                              _line('MST', _merchant!.taxCode ?? '--'),
                              _line('CCCD', _merchant!.citizenId ?? '--'),
                              _line('Địa chỉ', _merchant!.address ?? '--'),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                        Text('Kiosk đang phụ trách',
                            style: Theme.of(context).textTheme.titleMedium),
                        const SizedBox(height: 8),
                        if (_merchant!.activeAssignments.isEmpty)
                          const Card(
                              child: Padding(
                                  padding: EdgeInsets.all(16),
                                  child: Text('Chưa có kiosk đang gán')))
                        else
                          ..._merchant!.activeAssignments.map(
                            (a) => Card(
                              child: ListTile(
                                title: Text(a.kioskCode),
                                subtitle:
                                    Text('${a.marketName} • ${a.zoneName}'),
                                trailing: Text(a.startedAt == null
                                    ? '--'
                                    : FormatUtils.dateTime(
                                        '${a.startedAt}T00:00:00')),
                              ),
                            ),
                          ),
                        const SizedBox(height: 16),
                        Text('Lịch sử thanh toán gần đây',
                            style: Theme.of(context).textTheme.titleMedium),
                        const SizedBox(height: 8),
                        if (_payments.isEmpty)
                          const Card(
                              child: Padding(
                                  padding: EdgeInsets.all(16),
                                  child: Text(
                                      'Chưa có biên lai phù hợp để hiển thị')))
                        else
                          ..._payments.take(10).map(
                                (r) => Card(
                                  child: ListTile(
                                    title: Text('Biên lai #${r.receiptId}'),
                                    subtitle:
                                        Text(FormatUtils.dateTime(r.paidAt)),
                                    trailing: Text(FormatUtils.money(r.amount)),
                                    onTap: () => Navigator.pushNamed(
                                      context,
                                      '/collector/receipt-detail',
                                      arguments: r.receiptId,
                                    ),
                                  ),
                                ),
                              ),
                      ],
                    ),
    );
  }

  Widget _line(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Row(
        children: [
          SizedBox(
              width: 80,
              child: Text(label,
                  style: const TextStyle(color: AppColors.textSecondary))),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}
