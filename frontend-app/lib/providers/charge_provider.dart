import 'package:flutter/material.dart'; // Để nhận diện ChangeNotifier và notifyListeners
import 'package:frontend/core/services/api_services.dart';

class ChargeProvider extends ChangeNotifier {
  final ApiService api = ApiService();

  List charges = [];

  Future<void> fetchCharges() async {
    final res = await api.get("/charges");

    charges = res.data["data"];
    notifyListeners();
  }
}
