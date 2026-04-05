import 'package:flutter/material.dart';

import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/format_utils.dart';
import '../../models/debt_item.dart';
import '../../services/collector_service.dart';

class DebtsScreen extends StatefulWidget {
  const DebtsScreen({super.key});

  @override
  State<DebtsScreen> createState() => _DebtsScreenState();
}

class _DebtsScreenState extends State<DebtsScreen> {
  final CollectorService _service = CollectorService();
  final TextEditingController _searchCtrl = TextEditingController();

  List<DebtItem> _items = const [];
  bool _loading = true;
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
      final data = await _service.getDebts(query: _searchCtrl.text);
      setState(() => _items = data);
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final totalDebt = _items.fold<num>(0, (sum, item) => sum + item.debtAmount);
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Công nợ tổng hợp'),
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Tổng công nợ hiện tại'),
                  const SizedBox(height: 6),
                  Text(
                    FormatUtils.money(totalDebt),
                    style: const TextStyle(
                        fontSize: 28, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _searchCtrl,
                    decoration: InputDecoration(
                      hintText: 'Tìm kiosk / tiểu thương',
                      prefixIcon: const Icon(Icons.search),
                      suffixIcon: IconButton(
                        onPressed: _load,
                        icon: const Icon(Icons.arrow_forward_rounded),
                      ),
                    ),
                    onSubmitted: (_) => _load(),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            if (_error != null)
              Text(_error!, style: const TextStyle(color: AppColors.error)),
            if (_loading)
              const Padding(
                padding: EdgeInsets.only(top: 40),
                child: Center(child: CircularProgressIndicator()),
              )
            else if (_items.isEmpty)
              const Card(
                  child: Padding(
                      padding: EdgeInsets.all(20),
                      child: Text('Không có công nợ cần theo dõi.')))
            else
              ..._items.map(
                (item) => Card(
                  child: ListTile(
                    title: Text('${item.kioskCode} • ${item.merchantName}'),
                    subtitle: Text('${item.zoneName} • ${item.periodName}'),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          FormatUtils.money(item.debtAmount),
                          style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              color: AppColors.error),
                        ),
                        const SizedBox(height: 4),
                        Text('Đã thu ${FormatUtils.money(item.amountPaid)}',
                            style: const TextStyle(fontSize: 12)),
                      ],
                    ),
                    onTap: item.merchantId == null
                        ? null
                        : () => context.push(
                              '/collector/merchant-detail',
                              extra: item.merchantId,
                            ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
