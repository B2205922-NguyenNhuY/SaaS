import 'package:flutter/material.dart';

class ShiftManager with ChangeNotifier {
  bool _isStarted = false;

  bool get isStarted => _isStarted;

  Future<void> startShift() async {
    // TODO: gọi API thật sau
    await Future.delayed(Duration(seconds: 1));

    _isStarted = true;
    notifyListeners();
  }

  Future<void> endShift() async {
    _isStarted = false;
    notifyListeners();
  }
}