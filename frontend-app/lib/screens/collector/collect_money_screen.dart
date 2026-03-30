import 'package:flutter/material.dart';
import '../app_appbar.dart';

class CollectMoneyScreen extends StatelessWidget {
  final String id;

  const CollectMoneyScreen({super.key, required this.id});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const AppAppBar(title: "Thu tiền"),


      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [

            Text("Kiosk ID: $id"),

            const SizedBox(height: 20),

            TextField(
              decoration: const InputDecoration(
                labelText: "Số tiền",
                border: OutlineInputBorder(),
              ),
            ),

            const SizedBox(height: 20),

            ElevatedButton(
              onPressed: () {
                // TODO: API thu tiền
              },
              child: const Text("Xác nhận thu"),
            ),
          ],
        ),
      ),
    );
  }
}