import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:go_router/go_router.dart';
import '../../providers/debt_provider.dart';
import '../../providers/payment_provider.dart';
import '../../core/utils/ui_helpers.dart';
import 'debt_charge_card.dart';


class DebtSelectScreen extends StatefulWidget {
  const DebtSelectScreen({super.key});

  @override
  State<DebtSelectScreen> createState() => _DebtSelectScreenState();
}

class _DebtSelectScreenState extends State<DebtSelectScreen> with WidgetsBindingObserver {

  @override
  void initState() {
    super.initState();
    print("🔥 SCREEN INIT");
    WidgetsBinding.instance.addObserver(this);

    Future.microtask(() {
      context.read<DebtProvider>().fetchDebts();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      print("🔥 RETURN FROM MOMO");

      /// reload dữ liệu
      context.read<DebtProvider>().fetchDebts();
      context.read<PaymentProvider>().fetchReceipts();
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<DebtProvider>();
    print("🔥 DEBTS LENGTH: ${provider.debts.length}");
    return Scaffold(
      appBar: AppBar(title: const Text("Khoản cần thanh toán")),

      body: Column(
        children: [

          /// 🔥 LIST
          Expanded(
            child: provider.isLoadingDebts
                ? const Center(child: CircularProgressIndicator())
                : provider.debts.isEmpty
                    ? const Center(child: Text("Không có khoản nợ"))
                    : ListView.builder(
                        itemCount: provider.debts.length,
                        itemBuilder: (context, index) {
                          final d = provider.debts[index];

                          return DebtCard(
                            d: d,
                            enabled: provider.canSelect(index),
                            onTap: () => provider.toggleDebt(index),
                          );
                        },
                      ),
          ),

          /// 🔥 FOOTER
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              border: Border(top: BorderSide(color: Colors.grey)),
            ),
            child: Column(
              children: [

                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text("Tổng cần thanh toán"),
                    Text(
                      "${UIHelpers.formatMoney(provider.totalDebtSelected)} đ",
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.red,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 8),

                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: provider.selectAllDebts,
                    child: const Text("Chọn tất cả"),
                  ),
                ),

                const SizedBox(height: 12),

                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: provider.totalDebtSelected == 0
                        ? null
                        : () async {
                            final confirm = await _confirmPayment(context, provider);

                            if (confirm != true) return;

                            try {
                              final url = await context
                                  .read<DebtProvider>()
                                  .createMomoPayment();

                              if (url != null && context.mounted) {
                                final uri = Uri.parse(url);

                                if (await canLaunchUrl(uri)) {
                                  await launchUrl(uri, mode: LaunchMode.externalApplication);
                                } else {
                                  throw 'Không mở đc URL';
                                }
                              }
                            } catch (e) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text(e.toString())),
                              );
                            }
                          },
                    child: const Text("Thanh toán"),
                  )
                ),
              ],
            ),
          )
        ],
      ),
    );
  }

  Future<bool?> _confirmPayment(
    BuildContext context, DebtProvider provider) {
      return showDialog<bool>(
        context: context,
        builder: (_) => AlertDialog(
          title: const Text("Xác nhận thanh toán"),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text("Bạn có chắc muốn thanh toán các khoản đã chọn?"),
              const SizedBox(height: 10),

              /// 💰 tổng tiền
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text("Tổng tiền:"),
                  Text(
                    "${UIHelpers.formatMoney(provider.totalDebtSelected)} đ",
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.red,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 6),

              /// 📄 số khoản
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text("Số khoản:"),
                  Text("${provider.selectedChargeIds.length}"),
                ],
              ),
            ],
          ),

          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text("Hủy"),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text("Xác nhận"),
            ),
          ],
        ),
      );
    }
}