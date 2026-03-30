import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../providers/merchant_provider.dart';
import 'kiosk_card.dart';
import 'package:go_router/go_router.dart';

class KioskList extends StatelessWidget {
  const KioskList({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<MerchantProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        if (provider.kiosks.isEmpty) {
          return const Center(child: Text("Chưa có kiosk nào"));
        }

        return ListView.builder(
          shrinkWrap: true, // ✅ bắt buộc
          physics: const NeverScrollableScrollPhysics(),
          itemCount: provider.kiosks.length,
          itemBuilder: (context, index) {
            final kiosk = provider.kiosks[index];

            return KioskCard(
              kiosk: kiosk,
              onTap: () {
                context.push('/kiosk/${kiosk['id']}');
              },
            );
          },
        );
      },
    );
  }
}