import 'package:flutter/material.dart';
import '../screens/super_admin_page.dart';
import '../screens/tenant_admin_page.dart';
import '../screens/user_page.dart';

class RoleNavigator {
  static void navigate(BuildContext context, String role) {
    Widget page; 
    switch (role) {
      case "super_admin":
        page = SuperAdminPage();
        break;
      case "tenant_admin":
        page = TenantAdminPage();
        break;
      default:
        page = UserPage();
    }

    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (_) => page),
      (route) => false,
    );
  }
}