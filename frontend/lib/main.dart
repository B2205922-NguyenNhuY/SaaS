import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'providers/auth_provider.dart';
import 'providers/collector_provider.dart';
import 'screens/collector/collector_screen.dart';
import 'screens/collector/debts_screen.dart';
import 'screens/collector/merchant_detail_screen.dart';
import 'screens/collector/notifications_screen.dart';
import 'screens/collector/receipt_detail_screen.dart';
import 'screens/collector/receipt_history_screen.dart';
import 'screens/collector/shift_history_screen.dart';
import 'screens/login/login_screen.dart';
import 'screens/super_admin/super_admin_screen.dart';
import 'screens/tenant_admin/tenant_admin_screen.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()..bootstrap()),
        ChangeNotifierProvider(create: (_) => CollectorProvider()),
      ],
      child: const MarketHubApp(),
    ),
  );
}

class MarketHubApp extends StatelessWidget {
  const MarketHubApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MarketHub Admin',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorSchemeSeed: const Color(0xFF1E6FD9),
      ),
      home: const _AppEntry(),
      routes: {
        '/login': (_) => const LoginScreen(),
        '/super-admin': (_) => const SuperAdminScreen(),
        '/tenant-admin': (_) => const TenantAdminScreen(),
        '/collector': (_) => const CollectorScreen(),
        '/collector/receipts': (_) => const ReceiptHistoryScreen(),
        '/collector/debts': (_) => const DebtsScreen(),
        '/collector/shifts': (_) => const ShiftHistoryScreen(),
        '/collector/notifications': (_) => const NotificationsScreen(),
      },
      onGenerateRoute: (settings) {
        if (settings.name == '/collector/receipt-detail' &&
            settings.arguments is int) {
          return MaterialPageRoute(
            builder: (_) =>
                ReceiptDetailScreen(receiptId: settings.arguments as int),
          );
        }
        if (settings.name == '/collector/merchant-detail' &&
            settings.arguments is int) {
          return MaterialPageRoute(
            builder: (_) =>
                MerchantDetailScreen(merchantId: settings.arguments as int),
          );
        }
        return null;
      },
    );
  }
}

class _AppEntry extends StatelessWidget {
  const _AppEntry();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    if (!auth.isReady) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    switch (auth.status) {
      case AuthStatus.authenticated:
        switch (auth.role) {
          case AppRoles.superAdmin:
            return const SuperAdminScreen();
          case AppRoles.tenantAdmin:
            return const TenantAdminScreen();
          case AppRoles.collector:
            return const CollectorScreen();
          default:
            return const LoginScreen();
        }
      case AuthStatus.loading:
      case AuthStatus.initial:
        return const Scaffold(
          body: Center(child: CircularProgressIndicator()),
        );
      case AuthStatus.unauthenticated:
      case AuthStatus.error:
        return const LoginScreen();
    }
  }
}
