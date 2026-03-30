import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../providers/merchant_provider.dart';
import '../../providers/auth_provider.dart';
import 'debt_card.dart';
import 'last_payment_card.dart';
import 'kiosk_list.dart';
import 'pending_charge_list.dart';

class MerchantDashboardScreen extends StatefulWidget {
  const MerchantDashboardScreen({super.key});

  @override
  State<MerchantDashboardScreen> createState() =>
      _MerchantDashboardScreenState();
}

class _MerchantDashboardScreenState
    extends State<MerchantDashboardScreen> {

  @override
  void initState() {
    super.initState();

    Future.microtask(() {
      final auth = context.read<AuthProvider>();
      final merchantId = int.tryParse(auth.id ?? '0') ?? 0;

      final provider = context.read<MerchantProvider>();
      provider.fetchTotalDebt();
      provider.fetchKiosks();
      provider.fetchPendingCharges();
      provider.fetchLastPayment();
    });
  }

  Future<void> _refresh() async {
    final auth = context.read<AuthProvider>();
    final merchantId = int.tryParse(auth.id ?? '0') ?? 0;

    final provider = context.read<MerchantProvider>();

    await Future.wait([
      provider.fetchKiosks(),
      provider.fetchPendingCharges(),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<MerchantProvider>();

    if (provider.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return RefreshIndicator(
      onRefresh: _refresh,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          DebtCard(
            totalDebt: provider.totalDebt,
            onPay: () {
              Navigator.pushNamed(context, '/payment');
            },
          ),

          LastPaymentCard(data: provider.lastPayment),
          const SizedBox(height: 16),

          const Text(
            "Khoản cần thanh toán",
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),

          const SizedBox(height: 10),

          PendingChargeList(charges: provider.pendingCharges),


          const SizedBox(height: 16),

          /// 🔥 KIOSK LIST
          const Text(
            "Kiosk đang thuê",
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),

          const SizedBox(height: 10),

          const KioskList(),
        ],
      ),
    );
  }
}