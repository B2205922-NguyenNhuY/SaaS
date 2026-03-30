import 'package:flutter/material.dart';
import '../../../models/charge.dart';

class ChargesManager with ChangeNotifier {
  List<Charge> _items = [];

  String _filter = "all";

  List<Charge> get items {
  if (_filter == "unpaid") {
    return _items.where((c) => c.trangThai == 'chua_thu').toList();
  }
  if (_filter == "debt") {
    return _items.where((c) => c.trangThai == 'no').toList();
  }
  if (_filter == "paid") {
    return _items.where((c) => c.trangThai == 'da_thu').toList();
  }
  return _items;
}

  void setFilter(String filter) {
    _filter = filter;
    notifyListeners();
  }

  void setData(List<Charge> data) {
    _items = data;
    notifyListeners();
  }
}