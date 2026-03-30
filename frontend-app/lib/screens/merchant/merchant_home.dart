import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/notification_provider.dart';
import 'merchant_app_bar.dart';
import 'merchant_bottom_nav.dart';
import 'merchant_pages.dart';

class MerchantHomeScreen extends StatefulWidget {
  const MerchantHomeScreen({super.key});

  @override
  State<MerchantHomeScreen> createState() => _MerchantHomeScreenState();
}

class _MerchantHomeScreenState extends State<MerchantHomeScreen> {
  int currentIndex = 0;

  void onTabChanged(int index) {
    setState(() => currentIndex = index);
  }

  @override
  void initState() {
    super.initState();

    /// 🔥 LOAD notification khi vào app
    Future.microtask(() {
      context.read<NotificationProvider>().fetchNotifications();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: MerchantAppBar(),

      body: IndexedStack(
        index: currentIndex,
        children: merchantPages,
      ),

      bottomNavigationBar: MerchantBottomNav(
        currentIndex: currentIndex,
        onTap: onTabChanged,
      ),
    );
  }
}