import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/constants/app_colors.dart';
import '../../core/utils/format_utils.dart';
import '../../models/receipt_item.dart';
import '../../services/collector_service.dart';

class ReceiptHistoryScreen extends StatefulWidget {
  const ReceiptHistoryScreen({super.key});

  @override
  State<ReceiptHistoryScreen> createState() => _ReceiptHistoryScreenState();
}

class _ReceiptHistoryScreenState extends State<ReceiptHistoryScreen> {
  final CollectorService _service = CollectorService();
  final TextEditingController _searchCtrl = TextEditingController();

  List<ReceiptItem> _items = const [];
  bool _loading = true;
  String _paymentMethod = '';
  String? _fromDate;
  String? _toDate;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final data = await _service.getReceipts(
        query: _searchCtrl.text,
        paymentMethod: _paymentMethod,
        fromDate: _fromDate,
        toDate: _toDate,
      );
      setState(() => _items = data);
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _pickDate(bool isFrom) async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      firstDate: DateTime(now.year - 3),
      lastDate: DateTime(now.year + 1),
      initialDate: now,
    );
    if (picked == null) return;
    final raw = picked.toIso8601String().split('T').first;
    setState(() {
      if (isFrom) {
        _fromDate = raw;
      } else {
        _toDate = raw;
      }
    });
    await _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Lịch sử phiếu thu'),
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            _buildFilters(),
            const SizedBox(height: 16),
            if (_error != null) _ErrorCard(message: _error!),
            if (_loading)
              const Padding(
                padding: EdgeInsets.only(top: 40),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_items.isEmpty)
              const _EmptyCard(message: 'Không có phiếu thu phù hợp.')
            else
              ..._items.map(_buildReceiptTile),
          ],
        ),
      ),
    );
  }

  Widget _buildFilters() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.divider),
      ),
      child: Column(
        children: [
          TextField(
            controller: _searchCtrl,
            decoration: InputDecoration(
              hintText: 'Tìm theo ghi chú / mã biên lai',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: IconButton(
                icon: const Icon(Icons.arrow_forward_rounded),
                onPressed: _load,
              ),
            ),
            onSubmitted: (_) => _load(),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              ChoiceChip(
                label: const Text('Tất cả'),
                selected: _paymentMethod.isEmpty,
                onSelected: (_) {
                  setState(() => _paymentMethod = '');
                  _load();
                },
              ),
              ChoiceChip(
                label: const Text('Tiền mặt'),
                selected: _paymentMethod == 'tien_mat',
                onSelected: (_) {
                  setState(() => _paymentMethod = 'tien_mat');
                  _load();
                },
              ),
              ChoiceChip(
                label: const Text('Chuyển khoản'),
                selected: _paymentMethod == 'chuyen_khoan',
                onSelected: (_) {
                  setState(() => _paymentMethod = 'chuyen_khoan');
                  _load();
                },
              ),
              OutlinedButton.icon(
                onPressed: () => _pickDate(true),
                icon: const Icon(Icons.date_range_rounded),
                label: Text(_fromDate == null ? 'Từ ngày' : _fromDate!),
              ),
              OutlinedButton.icon(
                onPressed: () => _pickDate(false),
                icon: const Icon(Icons.event_available_rounded),
                label: Text(_toDate == null ? 'Đến ngày' : _toDate!),
              ),
              if (_fromDate != null || _toDate != null)
                TextButton(
                  onPressed: () {
                    setState(() {
                      _fromDate = null;
                      _toDate = null;
                    });
                    _load();
                  },
                  child: const Text('Xóa ngày'),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildReceiptTile(ReceiptItem item) {
    final color = item.paymentMethod == 'chuyen_khoan'
        ? AppColors.primary
        : AppColors.success;

    return Card(
      color: Colors.white,
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: CircleAvatar(
          backgroundColor: color.withOpacity(0.1),
          child: Icon(
            item.paymentMethod == 'chuyen_khoan'
                ? Icons.account_balance_rounded
                : Icons.payments_rounded,
            color: color,
          ),
        ),
        title: Text(
          'Biên lai #${item.receiptId}',
          style: GoogleFonts.inter(fontWeight: FontWeight.w700),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 6),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(FormatUtils.money(item.amount)),
              Text(FormatUtils.dateTime(item.paidAt)),
              if ((item.note ?? '').isNotEmpty) Text(item.note!),
            ],
          ),
        ),
        trailing: const Icon(Icons.chevron_right_rounded),
        onTap: () => Navigator.pushNamed(
          context,
          '/collector/receipt-detail',
          arguments: item.receiptId,
        ),
      ),
    );
  }
}

class _ErrorCard extends StatelessWidget {
  const _ErrorCard({required this.message});
  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.error.withOpacity(0.08),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(message, style: const TextStyle(color: AppColors.error)),
    );
  }
}

class _EmptyCard extends StatelessWidget {
  const _EmptyCard({required this.message});
  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(message, textAlign: TextAlign.center),
    );
  }
}
