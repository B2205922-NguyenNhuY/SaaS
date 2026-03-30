import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';

import '../../providers/auth_provider.dart';
import '../../providers/shift_provider.dart';

class AuthManager {
  static Future<void> login(
    BuildContext context,
    String input,
    String password,
  ) async {
    final auth = context.read<AuthProvider>();

    await auth.login(input, password);

    if (!auth.isLoggedIn) return;

    if (auth.isCollector) {
      final shift = context.read<ShiftProvider>();

      await shift.checkShift(); // 🔥 BẮT BUỘC

      if (shift.hasShift == true) {
        context.go('/collector');
      } else {
        context.go('/collector/select-market'); // 👈 mở ca
      }
    }

    if (auth.isMerchant) {
      context.go('/merchant');
    }
  }
}