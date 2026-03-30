import 'package:flutter/material.dart';

class MerchantBottomNav extends StatelessWidget {
  final int currentIndex;
  final Function(int) onTap;

  const MerchantBottomNav({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return BottomNavigationBar(
      currentIndex: currentIndex,
      onTap: onTap,
      type: BottomNavigationBarType.fixed,
      selectedItemColor: Colors.blue,
      unselectedItemColor: Colors.grey,
      items: const [
        BottomNavigationBarItem(
          icon: Icon(Icons.home_rounded),
          label: "Trang chủ",
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.account_balance_wallet_rounded),
          label: "Công nợ",
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.receipt_long_rounded),
          label: "Lịch sử",
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.person_rounded),
          label: "Tài khoản",
        ),
      ],
    );
  }
}