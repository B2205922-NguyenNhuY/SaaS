import 'package:flutter/material.dart';

class MarketDropdown extends StatelessWidget {
  final List markets;
  final int? selectedMarketId;
  final Function(int?) onChanged;

  const MarketDropdown({
    super.key,
    required this.markets,
    required this.selectedMarketId,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return DropdownButtonFormField<int>(
      value: selectedMarketId,
      hint: const Text("Chọn chợ"),
      isExpanded: true,
      items: markets.map((m) {
        return DropdownMenuItem(
          value: m['market_id'],
          child: Text(m['tenCho']),
        );
      }).toList(),
      onChanged: onChanged,
    );
  }
}