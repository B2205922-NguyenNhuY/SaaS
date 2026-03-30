import 'package:flutter/material.dart';

class StartShiftButton extends StatelessWidget {
  final bool isLoading;
  final VoidCallback onPressed;

  const StartShiftButton({
    super.key,
    required this.isLoading,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: isLoading ? null : onPressed,
      child: isLoading
          ? const SizedBox(
              height: 20,
              width: 20,
              child: CircularProgressIndicator(strokeWidth: 2),
            )
          : const Text("Mở ca làm việc"),
    );
  }
}