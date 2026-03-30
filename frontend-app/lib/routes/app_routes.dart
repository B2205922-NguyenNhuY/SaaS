import 'package:flutter/material.dart';
import '../modules/auth/screens/login_screen.dart';
import '../modules/super_admin/screens/super_admin_dashboard.dart';
import '../modules/tenant/screens/tenant_dashboard.dart';
import '../modules/mobile/screens/mobile_screen.dart';

class AppRoutes {
  static Map<String, WidgetBuilder> routes = {
    "/": (_) => LoginScreen(),
    "/super_admin": (_) => SuperAdminDashboard(),
    "/tenant": (_) => TenantDashboard(),
    "/mobile": (_) => MobileScreen(),
  };
}