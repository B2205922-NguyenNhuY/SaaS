import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/auth_provider.dart';

class LoginMobileScreen extends StatefulWidget {
  final AuthProvider auth;

  const LoginMobileScreen({super.key, required this.auth});

  @override
  State<LoginMobileScreen> createState() => _LoginMobileScreenState();
}

class _LoginMobileScreenState extends State<LoginMobileScreen> {
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _obscure = true;

  bool _isEmail(String input) {
    return input.contains('@');
  }

  bool _isPhone(String input) {
    return RegExp(r'^[0-9]{9,11}$').hasMatch(input);
  }

  @override
  Widget build(BuildContext context) {
    final auth = widget.auth;

    return Scaffold(
      body: SizedBox.expand(
        child: Container(
            decoration: const BoxDecoration(
            gradient: LinearGradient(
                colors: [
                AppColors.primary,
                AppColors.primaryDark,
                ],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
            ),
            ),
            child: SafeArea(
            child: Column(
                children: [
                const SizedBox(height: 40),

                // 🔰 Logo + title
                Column(
                    children: [
                    Image.asset('assets/images/logo.png', height: 200),
                    const SizedBox(height: 12),
                    const Text(
                        'Đăng nhập',
                        style: TextStyle(color: Colors.white, fontSize: 26),
                    ),
                    ],
                ),

                // 🔥 Quan trọng: đẩy form xuống giữa
                const Spacer(),

                // 🔲 Card login
                Padding(
                    padding: const EdgeInsets.all(24),
                    child: _buildLoginCard(),
                ),

                const Spacer(),
                ],
            ),
            ),
        ),
        ),
    );
  }

  Widget _buildLoginCard() {
  return Container(
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(20),
    ),
    child: Column(
      children: [
        TextField(
          controller: _emailCtrl,
          onChanged: (_) => setState(() {}),
          decoration: InputDecoration(
            labelText: 'Email hoặc số điện thoại',
            prefixIcon: Icon(
              _emailCtrl.text.contains('@')
                  ? Icons.email_outlined
                  : Icons.phone_outlined,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),

        const SizedBox(height: 16),

        TextField(
          controller: _passwordCtrl,
          obscureText: _obscure,
          decoration: InputDecoration(
            labelText: 'Mật khẩu',
            prefixIcon: const Icon(Icons.lock_outline),
            suffixIcon: IconButton(
              icon: Icon(
                _obscure
                    ? Icons.visibility_off
                    : Icons.visibility,
              ),
              onPressed: () {
                setState(() => _obscure = !_obscure);
              },
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        ),

        const SizedBox(height: 20),

        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton(
            onPressed: () {
              final input = _emailCtrl.text.trim();

              if (!_isEmail(input) && !_isPhone(input)) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Email hoặc số điện thoại không hợp lệ'),
                  ),
                );
                return;
              }

              context.read<AuthProvider>().login(
                input,
                _passwordCtrl.text,
              );
            },
            child: const Text('Đăng nhập'),
          ),
        ),
      ],
    ),
  );
}
}