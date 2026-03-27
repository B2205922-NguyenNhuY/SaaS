import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'providers/auth_provider.dart';
import 'providers/collector_provider.dart';
import 'screens/collector/collector_screen.dart';
import 'screens/login/login_screen.dart';
import 'screens/super_admin/super_admin_screen.dart';
import 'screens/tenant_admin/tenant_admin_screen.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
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
      initialRoute: '/',
      routes: {
        '/': (_) => const LoginScreen(),
        '/super-admin': (_) => const SuperAdminScreen(),
        '/tenant-admin': (_) => const TenantAdminScreen(),
        '/collector': (_) => const CollectorScreen(),
      },
    );
  }
}
