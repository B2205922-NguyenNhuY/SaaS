import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../providers/auth_provider.dart';
import 'auth_manager.dart';

class AuthCard extends StatefulWidget {
  @override
  _AuthCardState createState() => _AuthCardState();
}

class _AuthCardState extends State<AuthCard> {
  final emailCtrl = TextEditingController();
  final passCtrl  = TextEditingController();

  bool _obscure = true;

  // ✅ validate
  bool _isEmail(String input) {
    return input.contains('@');
  }

  bool _isPhone(String input) {
    return RegExp(r'^[0-9]{9,11}$').hasMatch(input);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: const [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 20,
          )
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [

          // 🔥 Title
          const Text(
            "Đăng nhập",
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),

          const SizedBox(height: 20),

          // 🔥 Email hoặc SĐT
          TextField(
            controller: emailCtrl,
            onChanged: (_) => setState(() {}),
            keyboardType: emailCtrl.text.contains('@')
                ? TextInputType.emailAddress
                : TextInputType.phone,
            decoration: InputDecoration(
              labelText: "Email hoặc số điện thoại",
              hintText: "abc@gmail.com hoặc 090xxxxxxx",

              prefixIcon: Icon(
                emailCtrl.text.contains('@')
                    ? Icons.email_outlined
                    : Icons.phone_outlined,
              ),

              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),

          const SizedBox(height: 16),

          // 🔐 Password
          TextField(
            controller: passCtrl,
            obscureText: _obscure,
            decoration: InputDecoration(
              labelText: "Mật khẩu",
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

          // 🔄 Loading
          if (auth.status == AuthStatus.loading)
            const CircularProgressIndicator(),

          // 🚀 Button login
          if (auth.status != AuthStatus.loading)
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: () {
                  final input = emailCtrl.text.trim();

                  if (!_isEmail(input) && !_isPhone(input)) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text("Email hoặc số điện thoại không hợp lệ"),
                      ),
                    );
                    return;
                  }

                  AuthManager.login(
                    context,
                    input,
                    passCtrl.text,
                  );
                },
                style: ElevatedButton.styleFrom(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text(
                  "Đăng nhập",
                  style: TextStyle(fontSize: 16),
                ),
              ),
            ),

            const SizedBox(height: 12),

            // ✅ NÚT GOOGLE RIÊNG
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: () {
                  context.read<AuthProvider>().loginWithGoogle();
                },
                child: const Text("Login with Google"),
              ),
            ),

          const SizedBox(height: 12),

          // ❌ Error
          if (auth.status == AuthStatus.error)
            Text(
              auth.errorMessage ?? "Đăng nhập thất bại",
              style: const TextStyle(color: Colors.red),
            ),
        ],
      ),
    );
  }
}