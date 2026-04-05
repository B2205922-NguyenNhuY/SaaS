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
        context.go('/collector');
    }

    if (auth.isMerchant) {
      context.go('/merchant');
    }
  }
}