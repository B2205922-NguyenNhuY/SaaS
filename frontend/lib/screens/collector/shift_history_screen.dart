import 'package:flutter/material.dart';

import '../../core/utils/format_utils.dart';
import '../../models/receipt_item.dart';
import '../../models/shift_info.dart';
import '../../services/collector_service.dart';

class ShiftHistoryScreen extends StatefulWidget {
  const ShiftHistoryScreen({super.key});

  @override
  State<ShiftHistoryScreen> createState() => _ShiftHistoryScreenState();
}

class _ShiftHistoryScreenState extends State<ShiftHistoryScreen> {
  final CollectorService _service = CollectorService();
  List<ShiftInfo> _shifts = const [];
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
      final data = await _service.getShifts();
      setState(() => _shifts = data);
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _openShiftDetail(ShiftInfo shift) async {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => _ShiftReceiptsSheet(shift: shift),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Lịch sử ca & đối soát'),
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            if (_error != null)
              Text(_error!, style: const TextStyle(color: Colors.red)),
            if (_loading)
              const Padding(
                padding: EdgeInsets.only(top: 40),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_shifts.isEmpty)
              const Card(
                  child: Padding(
                      padding: EdgeInsets.all(20),
                      child: Text('Chưa có lịch sử ca.')))
            else
              ..._shifts.map(
                (shift) => Card(
                  child: ListTile(
                    title: Text('Ca #${shift.shiftId}'),
                    subtitle: Text(
                      'Bắt đầu ${FormatUtils.dateTime(shift.startedAt)}Kết thúc ${FormatUtils.dateTime(shift.endedAt)}',
                    ),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('TM ${FormatUtils.money(shift.cashTotal)}'),
                        Text('CK ${FormatUtils.money(shift.transferTotal)}'),
                      ],
                    ),
                    onTap: () => _openShiftDetail(shift),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _ShiftReceiptsSheet extends StatefulWidget {
  const _ShiftReceiptsSheet({required this.shift});
  final ShiftInfo shift;

  @override
  State<_ShiftReceiptsSheet> createState() => _ShiftReceiptsSheetState();
}

class _ShiftReceiptsSheetState extends State<_ShiftReceiptsSheet> {
  final CollectorService _service = CollectorService();
  List<ReceiptItem> _receipts = const [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await _service.getReceipts(shiftId: widget.shift.shiftId);
      if (mounted) setState(() => _receipts = data);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Đối soát ca #${widget.shift.shiftId}',
                style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 12),
            if (_loading)
              const Padding(
                padding: EdgeInsets.all(24),
                child: CircularProgressIndicator(),
              )
            else if (_receipts.isEmpty)
              const Padding(
                padding: EdgeInsets.all(24),
                child: Text('Ca này chưa có giao dịch.'),
              )
            else
              SizedBox(
                height: 320,
                child: ListView(
                  children: _receipts
                      .map(
                        (item) => ListTile(
                          title: Text('Biên lai #${item.receiptId}'),
                          subtitle: Text(FormatUtils.dateTime(item.paidAt)),
                          trailing: Text(FormatUtils.money(item.amount)),
                          onTap: () => Navigator.pushNamed(
                            context,
                            '/collector/receipt-detail',
                            arguments: item.receiptId,
                          ),
                        ),
                      )
                      .toList(),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
