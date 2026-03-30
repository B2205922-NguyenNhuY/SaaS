import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class ChargeListScreen extends StatelessWidget {
  const ChargeListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Danh sách thu")),

      body: ListView.builder(
        itemCount: 10,
        itemBuilder: (_, i) => Card(
          child: ListTile(
            title: Text("Kiosk A$i"),
            subtitle: const Text("Cần thu: 200,000đ"),
            trailing: ElevatedButton(
              onPressed: () {
                context.go('/collector/collect/$i');
              },
              child: const Text("Thu"),
            ),
          ),
        ),
      ),
    );
  }
}