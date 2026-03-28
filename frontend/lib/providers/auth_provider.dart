import 'package:flutter/material.dart';

import '../services/auth_service.dart';
import '../services/storage_service.dart';

enum AuthStatus { initial, loading, authenticated, unauthenticated, error }

class AppRoles {
  static const String superAdmin = 'super_admin';
  static const String tenantAdmin = 'tenant_admin';
  static const String collector = 'collector';
  static const String merchant = 'merchant';
}

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();
  final StorageService _storageService = StorageService();

  AuthStatus status = AuthStatus.initial;
  String? token;
  String? role;
  String? userName;
  String? errorMessage;

  bool get isSuperAdmin => role == AppRoles.superAdmin;
  bool get isTenantAdmin => role == AppRoles.tenantAdmin;
  bool get isCollector => role == AppRoles.collector;
  bool get isReady => status != AuthStatus.initial;

  String get homeRoute {
    switch (role) {
      case AppRoles.superAdmin:
        return '/super-admin';
      case AppRoles.tenantAdmin:
        return '/tenant-admin';
      case AppRoles.collector:
        return '/collector';
      default:
        return '/login';
    }
  }

  Future<void> bootstrap() async {
    try {
      final savedToken = await _storageService.getToken();
      final savedRole = await _storageService.getRole();
      final savedName = await _storageService.getName();

      if ((savedToken ?? '').isNotEmpty && (savedRole ?? '').isNotEmpty) {
        token = savedToken;
        role = savedRole;
        userName = savedName ?? '';
        status = AuthStatus.authenticated;
      } else {
        status = AuthStatus.unauthenticated;
      }
    } catch (_) {
      status = AuthStatus.unauthenticated;
    }
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    status = AuthStatus.loading;
    errorMessage = null;
    notifyListeners();
    try {
      final data = await _authService.login(email, password);
      await _saveAndNotify(data);
    } catch (e) {
      errorMessage = e.toString().replaceAll('Exception: ', '');
      status = AuthStatus.error;
      notifyListeners();
    }
  }

  Future<void> googleLogin() async {
    status = AuthStatus.loading;
    errorMessage = null;
    notifyListeners();
    try {
      final data = await _authService.googleLogin();
      await _saveAndNotify(data);
    } catch (e) {
      errorMessage = e.toString().replaceAll('Exception: ', '');
      status = AuthStatus.error;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await _authService.logout();
    await _storageService.clearSession();
    token = null;
    role = null;
    userName = null;
    status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  Future<void> _saveAndNotify(Map<String, dynamic> data) async {
    token = data['token']?.toString();
    final user = data['user'] as Map<String, dynamic>?;
    role = user?['role']?.toString();
    userName = user?['hoTen']?.toString() ?? user?['email']?.toString() ?? '';

    await _storageService.saveSession(
      token: token ?? '',
      role: role ?? '',
      name: userName ?? '',
    );

    status = AuthStatus.authenticated;
    notifyListeners();
  }
}
