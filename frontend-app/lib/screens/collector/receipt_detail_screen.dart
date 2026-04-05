import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';

import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/format_utils.dart';
import '../../models/receipt_detail.dart';
import '../../services/api_client.dart';
import '../../services/collector_service.dart';

class ReceiptDetailScreen extends StatefulWidget {
  const ReceiptDetailScreen({super.key, required this.receiptId});

  final int receiptId;

  @override
  State<ReceiptDetailScreen> createState() => _ReceiptDetailScreenState();
}

class _ReceiptDetailScreenState extends State<ReceiptDetailScreen> {
  final CollectorService _service = CollectorService();
  ReceiptDetail? _detail;
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
      final data = await _service.getReceiptDetail(widget.receiptId);
      setState(() => _detail = data);
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _shareReceipt() async {
    final detail = _detail;
    if (detail == null) return;

    final buffer = StringBuffer()
      ..writeln('Biên lai #${detail.receipt.receiptId}')
      ..writeln('Số tiền: ${FormatUtils.money(detail.receipt.amount)}')
      ..writeln('Hình thức: ${detail.receipt.paymentMethod}')
      ..writeln('Thời gian: ${FormatUtils.dateTime(detail.receipt.paidAt)}')
      ..writeln('Nhân viên thu: ${detail.receipt.collectorName ?? '--'}');

    if ((detail.receipt.note ?? '').isNotEmpty) {
      buffer.writeln('Ghi chú: ${detail.receipt.note}');
    }

    for (final line in detail.charges) {
      buffer.writeln(
        '- ${line.kiosk} / ${line.merchant}: ${FormatUtils.money(line.amountPaid)}',
      );
    }

    await Share.share(buffer.toString());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('Biên lai #${widget.receiptId}'),
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        actions: [
          IconButton(
            onPressed: _detail == null ? null : _shareReceipt,
            icon: const Icon(Icons.share_rounded),
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Text(_error!))
              : _detail == null
                  ? const Center(child: Text('Không tìm thấy biên lai'))
                  : ListView(
                      padding: const EdgeInsets.all(16),
                      children: [
                        _SummaryCard(detail: _detail!),
                        const SizedBox(height: 16),
                        if ((_detail!.receipt.imageUrl ?? '').isNotEmpty)
                          _buildImage(),
                        const SizedBox(height: 16),
                        Text(
                          'Các khoản đã thu',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 8),
                        ..._detail!.charges.map(
                          (line) => Card(
                            child: ListTile(
                              title: Text('${line.kiosk} • ${line.merchant}'),
                              subtitle:
                                  Text('${line.periodName} • ${line.feeName}'),
                              trailing: Text(
                                FormatUtils.money(line.amountPaid),
                                style: const TextStyle(
                                    fontWeight: FontWeight.bold),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
    );
  }

  Widget _buildImage() {
    final raw = _detail!.receipt.imageUrl!;
    final serverBase = ApiClient.baseUrl.replaceFirst('/api', '');
    final imageUrl = raw.startsWith('http') ? raw : '$serverBase$raw';

    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: Image.network(
        imageUrl,
        height: 220,
        fit: BoxFit.cover,
        errorBuilder: (_, __, ___) => Container(
          height: 120,
          color: Colors.white,
          alignment: Alignment.center,
          child: const Text('Không tải được ảnh xác nhận'),
        ),
      ),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  const _SummaryCard({required this.detail});

  final ReceiptDetail detail;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            FormatUtils.money(detail.receipt.amount),
            style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 8),
          _line('Hình thức', detail.receipt.paymentMethod),
          _line('Thời gian', FormatUtils.dateTime(detail.receipt.paidAt)),
          _line('Nhân viên', detail.receipt.collectorName ?? '--'),
          _line('Ghi chú', detail.receipt.note ?? '--'),
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
            width: 90,
            child: Text(
              label,
              style: const TextStyle(color: AppColors.textSecondary),
            ),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}
