// ignore_for_file: unused_import
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;
import 'services/notification_service.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

// 🔐 Auth
import 'providers/auth_provider.dart';
import 'screens/auth/auth_screen.dart';
import 'screens/auth/splash_screen.dart';

// 👨‍💼 Merchant
import 'screens/merchant/merchant_home.dart';
import 'screens/merchant/payment_history_screen.dart';
import 'screens/charges/charge_list_screen.dart';
import 'screens/merchant/edit_profile_screen.dart';
import 'screens/merchant/payment_success_screen.dart';
import 'screens/merchant/notification_screen.dart';
import 'screens/merchant/debt_select_screen.dart';


import 'providers/shift_provider.dart';
import 'providers/merchant_provider.dart';
import 'providers/kiosk_provider.dart';
import 'providers/payment_provider.dart';
import 'providers/debt_provider.dart';
import 'providers/notification_provider.dart';
import 'providers/collector_provider.dart';

import 'screens/merchant/kiosk_detail_screen.dart';
// 🚚 Collector
import 'screens/collector/collector_screen.dart';
import 'screens/collector/debts_screen.dart';
import 'screens/collector/merchant_detail_screen.dart';
import 'screens/collector/notifications_screen.dart';
import 'screens/collector/receipt_detail_screen.dart';
import 'screens/collector/receipt_history_screen.dart';
import 'screens/collector/shift_history_screen.dart';

import 'firebase_options.dart';

final navigatorKey = GlobalKey<NavigatorState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  await NotificationService.init();
  //await PushNotificationService.initialize(); 
  //await FirebaseMessaging.instance.requestPermission();

  runApp(const MyApp());
}


class MyApp extends StatefulWidget {
  const MyApp({super.key});

   @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  final authProvider = AuthProvider();
 
  @override
  void initState() {
    super.initState();
    _initAuth();

    _handleInitialMessage();

    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage msg) {
      final data = msg.data;

      if (navigatorKey.currentContext != null) {
        GoRouter.of(navigatorKey.currentContext!).push(
          '/debt-select',
        );
      }
    });
    
  }

  void _handleInitialMessage() async {
    final msg = await FirebaseMessaging.instance.getInitialMessage();

    if (msg != null) {
      final data = msg.data;

      if (navigatorKey.currentContext != null) {
        GoRouter.of(navigatorKey.currentContext!).push(
          '/debt-select'
        );
      }
    }
  }

  Future<void> _initAuth() async {
    await authProvider.tryAutoLogin();
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: authProvider),

        ChangeNotifierProvider(create: (_) => CollectorProvider()),
        ChangeNotifierProvider(create: (_) => ShiftProvider()),
        ChangeNotifierProvider(create: (_) => MerchantProvider()),
        ChangeNotifierProvider(create: (_) => KioskProvider()),
        ChangeNotifierProvider(create: (_) => PaymentProvider()),
        ChangeNotifierProvider(create: (_) => DebtProvider()),
        ChangeNotifierProvider(create: (_) => NotificationProvider()),
      ],
      child: const AppRouter(),
    );
  }
}

class AppRouter extends StatelessWidget {
  const AppRouter({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.read<AuthProvider>();

    final GoRouter router = GoRouter(
      debugLogDiagnostics: true,
      navigatorKey: navigatorKey,
      initialLocation: '/',

      refreshListenable: auth,

      // 🔥 CORE LOGIC
      redirect: (context, state) {
        final auth = context.read<AuthProvider>();
        final isAuthPage = state.fullPath == '/auth';
        final isSplash = state.fullPath == '/';

        if (auth.status == AuthStatus.initial ||
            auth.status == AuthStatus.loading) {
          return isSplash ? null : '/';
        }

        // ❌ chưa login → luôn về auth
        if (!auth.isLoggedIn) {
          return isAuthPage ? null : '/auth';
        }

        // ✅ đã login mà vào auth → redirect theo role
        if (auth.isLoggedIn && (isSplash || isAuthPage)) {
          return auth.homeRoute;
        }

        // ❌ Collector mà vào merchant
        if (auth.isCollector && state.fullPath!.startsWith('/merchant')) {
          return '/collector';
        }

        // ❌ Merchant mà vào collector
        if (auth.isMerchant && state.fullPath!.startsWith('/collector')) {
          return '/merchant';
        }

        return null;
      },

      routes: [
        GoRoute(
          path: '/',
          builder: (context, state) => const SplashScreen(),
        ),

        // 🔐 AUTH
        GoRoute(
          path: '/auth',
          builder: (context, state) => const AuthScreen(),
        ),

        // 🚪 LOGOUT
        GoRoute(
          path: '/logout',
          builder: (context, state) {
            context.read<AuthProvider>().logout();
            return const SplashScreen();
          },
        ),

        // 👨‍💼 MERCHANT
        GoRoute(
          path: '/merchant',
          builder: (context, state) => const MerchantHomeScreen(),
        ),

        GoRoute(
          path: '/kiosk/:id',
          builder: (context, state) {
            final id = int.parse(state.pathParameters['id']!);
            return KioskDetailScreen(kioskId: id);
          },
        ),

        GoRoute(
          path: '/edit-profile',
          builder: (_, __) => const EditProfileScreen(),
        ),

        GoRoute(
          path: '/payment-success',
          builder: (_, __) => const PaymentSuccessScreen(),
        ),

        GoRoute(
          path: '/notifications',
          builder: (_, __) => const NotificationScreen(),
        ), 

        GoRoute(
          path: '/debt-select',
          builder: (_, __) => const DebtSelectScreen(),
        ),

        // 🚚 COLLECTOR EXTRA (từ code trên)
         GoRoute(
          path: '/collector',
          builder: (context, state) => const CollectorScreen(),
        ),

        GoRoute(
          path: '/collector/receipts',
          builder: (_, __) => const ReceiptHistoryScreen(),
        ),

        GoRoute(
          path: '/collector/debts',
          builder: (_, __) => const DebtsScreen(),
        ),

        GoRoute(
          path: '/collector/shifts',
          builder: (_, __) => const ShiftHistoryScreen(),
        ),

        GoRoute(
          path: '/collector/notifications',
          builder: (_, __) => const NotificationsScreen(),
        ),

        GoRoute(
          path: '/collector/receipt-detail',
          builder: (context, state) {
            final id = state.extra as int;
            return ReceiptDetailScreen(receiptId: id);
          },
        ),

        GoRoute(
          path: '/collector/merchant-detail',
          builder: (context, state) {
            final args = state.extra as Map<String, int?>?;
            final merchantId = args?['merchantId'] ?? 0; // default = 0 nếu null
            final chargeId = args?['chargeId'] ?? 0;

            return MerchantDetailScreen(
              merchantId: merchantId,
              chargeId: chargeId,
            );
          },
        ),

        GoRoute(
          path: '/merchant/history',
          builder: (_, __) => const PaymentHistoryScreen(),
        ),
      ],
    );

    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      title: 'SaaS Manager',
      routerConfig: router,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
    );
  }
}

//
// ====== COMMON SCREENS ======
//

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: CircularProgressIndicator()),
    );
  }
}