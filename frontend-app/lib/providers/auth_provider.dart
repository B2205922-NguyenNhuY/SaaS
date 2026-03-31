import 'package:flutter/material.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import '../services/auth_service.dart';
import '../services/storage_service.dart';
import '../services/notification_service.dart';

enum AuthStatus { initial, loading, authenticated, unauthenticated, error }

class AppRoles {
  static const String collector = 'collector';
  static const String merchant  = 'merchant';
}

class AuthProvider extends ChangeNotifier {
  final _authService    = AuthService();
  final _storageService = StorageService();

  AuthStatus status = AuthStatus.initial;

  String? token;
  String? id;
  String? role;
  String? email;
  String? name;
  String? errorMessage;

  // ================= GETTER =================
  bool get isCollector => role == AppRoles.collector;
  bool get isMerchant  => role == AppRoles.merchant;
  bool get isLoggedIn => token != null;

  String get homeRoute {
    switch (role) {
      case AppRoles.collector:
        return '/collector';
      case AppRoles.merchant:
        return '/merchant';
      default:
        return '/login';
    }
  }

  // ================= HELPER =================
  bool _isEmail(String input) => input.contains('@');
  bool _isPhone(String input) => RegExp(r'^0[0-9]{9,10}$').hasMatch(input);

  // ================= LOGIN =================
  Future<void> login(String account, String password) async {
    status = AuthStatus.loading;
    errorMessage = null;
    notifyListeners();

    try {
      // 🔥 validate trước
      if (!_isEmail(account) && !_isPhone(account)) {
        throw Exception("Email hoặc số điện thoại không hợp lệ");
      }
      print("chưa đăng nhập");


      // 🔥 gọi API
      final data = await _authService.login(account, password);
      print("đã đăng nhập: $data");
      await _saveAndNotify(data);

    } catch (e) {
      errorMessage = e.toString().replaceAll('Exception: ', '');
      status = AuthStatus.error;
      notifyListeners();
    }
  }

  // ================= LOGOUT =================
  Future<void> logout() async {
    if (role == AppRoles.merchant && id != null) {
      await FirebaseMessaging.instance
          .unsubscribeFromTopic("merchant_$id");
    }
    await _authService.logout();
    await _storageService.clearSession();

    token = null;
    role = null;
    name = null;
    email = null;

    status = AuthStatus.unauthenticated;
    notifyListeners();
  }

  // ================= AUTO LOGIN =================
  Future<void> tryAutoLogin() async {
    final session = await _storageService.getSession();

    if (session == null) {
      status = AuthStatus.unauthenticated;
      notifyListeners();
      return;
    }

    final token = session['token'];

    // 🔥 check hết hạn
    final isExpired = JwtDecoder.isExpired(token);

    if (isExpired) {
      await _storageService.clearSession();

      status = AuthStatus.unauthenticated;
      notifyListeners();
      return;
    }

    // ✅ còn hạn → login
    this.token = token;
    role  = session['role'];
    name  = session['name'];
    email = session['email'];

    status = AuthStatus.authenticated;
    notifyListeners();
  }

  // ================= SAVE =================
  Future<void> _saveAndNotify(Map<String, dynamic> data) async {
    token = data['token'];

    final user = data['user'] as Map<String, dynamic>?;

    role  = user?['role'];
    name  = user?['name'] ?? user?['hoTen'];
    email = user?['email'];
    id = user?['id']?.toString();

    await _storageService.saveSession(
      token: token!,
      role: role ?? '',
      name: name ?? '',
      email: email ?? '',
      id: id ?? '',
    );
    print("id: $id");
    if (role == AppRoles.merchant && id != null) {
      final userId = int.tryParse(id!);
      
      if (userId != null) {
        await NotificationService.subscribeMerchant(userId);
      }

  }


    status = AuthStatus.authenticated;
    notifyListeners();
  }

  Future<void> loginWithGoogle() async {
  status = AuthStatus.loading;
  notifyListeners();

  try {
    final GoogleSignInAccount? googleUser =
        await GoogleSignIn().signIn();

    if (googleUser == null) {
      status = AuthStatus.unauthenticated;
      notifyListeners();
      return;
    }

    final googleAuth = await googleUser.authentication;

    final credential = GoogleAuthProvider.credential(
      idToken: googleAuth.idToken,
    );

    final userCredential =
        await FirebaseAuth.instance.signInWithCredential(credential);

    final firebaseUser = userCredential.user;

    if (firebaseUser == null) {
      throw Exception("Không lấy được user từ Google");
    }

    // 👉 Gửi token lên backend (QUAN TRỌNG nếu bạn có server)
    final idToken = await firebaseUser.getIdToken();

    final data = await _authService.loginWithGoogle(idToken!);

    await _saveAndNotify(data);

  } catch (e) {
    errorMessage = e.toString().replaceAll('Exception: ', '');
    status = AuthStatus.error;
    notifyListeners();
  }
}
}