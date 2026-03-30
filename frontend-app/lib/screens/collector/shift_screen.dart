import 'package:flutter/material.dart';
import '../app_appbar.dart';

class ShiftScreen extends StatelessWidget {
  const ShiftScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: const AppAppBar(title: "Shift"),

      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [

            ElevatedButton(
              onPressed: () {},
              child: const Text("Start Shift"),
            ),

            ElevatedButton(
              onPressed: () {},
              child: const Text("End Shift"),
            ),
          ],
        ),
      ),
    );
  }
}