import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'shift_manager.dart';
import 'start_shift_screen.dart';
import 'collector_home.dart';
import '../charges/charges_manager.dart';

class CollectorResponsiveScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ShiftManager()),
        ChangeNotifierProvider(create: (_) => ChargesManager()), // ✅ thêm đúng chỗ
      ],
      child: Consumer<ShiftManager>(
        builder: (context, shift, _) {
          // ❌ chưa mở ca
          if (!shift.isStarted) {
            return StartShiftScreen();
          }

          // ✅ đã mở ca
          create: (_) => ChargesManager();
          return CollectorHome();
        },
      ),
    );
  }
}
