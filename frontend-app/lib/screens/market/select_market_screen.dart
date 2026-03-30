import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/shift_provider.dart';
import 'package:go_router/go_router.dart';

class SelectMarketScreen extends StatefulWidget {
  const SelectMarketScreen({super.key});

  @override
  State<SelectMarketScreen> createState() => _SelectMarketScreenState();
}

class _SelectMarketScreenState extends State<SelectMarketScreen> {
  List markets = [];
  int? selectedMarketId;

  @override
  void initState() {
    super.initState();
    fetchMarkets();
  }

  Future<void> fetchMarkets() async {
    // TODO: gọi API lấy market
    setState(() {
      markets = [
        {'id': 1, 'name': 'Chợ Cái Khế'},
        {'id': 2, 'name': 'Chợ Ninh Kiều'},
      ];
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Chọn chợ")),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              itemCount: markets.length,
              itemBuilder: (context, index) {
                final m = markets[index];
                return RadioListTile(
                  title: Text(m['name']),
                  value: m['id'],
                  groupValue: selectedMarketId,
                  onChanged: (val) {
                    setState(() {
                      selectedMarketId = val as int;
                    });
                  },
                );
              },
            ),
          ),

          ElevatedButton(
            onPressed: selectedMarketId == null
                ? null
                : () async {
                    final shift = context.read<ShiftProvider>();

                    // 🔥 gọi API mở ca + truyền market
                    await shift.startShift(selectedMarketId!);

                    context.go('/collector');
                  },
            child: const Text("Mở ca"),
          ),
        ],
      ),
    );
  }
}