import 'package:flutter/material.dart';
import 'merchant_dashboard.dart';
import 'profile_screen.dart';
import 'payment_history_screen.dart';
import 'debt_select_screen.dart';

final List<Widget> merchantPages = [
  const MerchantDashboardScreen(),
  const DebtSelectScreen(),
  const PaymentHistoryScreen(),
  const ProfileScreen(), 
];