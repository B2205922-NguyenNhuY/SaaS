import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';

import '../../providers/shift_provider.dart';
import '../../providers/market_provider.dart';

class OpenShiftScreen extends StatefulWidget {
  const OpenShiftScreen({super.key});

  @override
  State<OpenShiftScreen> createState() => _OpenShiftScreenState();
}

class _OpenShiftScreenState extends State<OpenShiftScreen> {
  int? selectedMarketId;

  @override
  void initState() {
    super.initState();
  }

  void _openShift(BuildContext context) async {
    if (selectedMarketId == null) return;

    try {
      await context.read<ShiftProvider>().startShift(selectedMarketId!);

      if (!mounted) return;
      context.go('/collector');
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {

    return Scaffold(
      appBar: AppBar(title: const Text('Mở ca')),
    );
    //   body: marketProvider.isLoading
    //       ? const Center(child: CircularProgressIndicator())
    //       : Padding(
    //           padding: const EdgeInsets.all(16),
    //           child: Column(
    //             children: [
    //               DropdownButtonFormField<int>(
    //                 value: selectedMarketId,
    //                 hint: const Text('Chọn chợ'),
    //                 isExpanded: true,
    //                 items: marketProvider.markets
    //                     .map<DropdownMenuItem<int>>((m) => DropdownMenuItem<int>(
    //                           value: m['market_id'] as int,
    //                           child: Text(m['tenCho']),
    //                         ))
    //                     .toList(),
    //                 onChanged: (value) =>
    //                     setState(() => selectedMarketId = value),
    //               ),

    //               const SizedBox(height: 20),

    //               SizedBox(
    //                 width: double.infinity,
    //                 child: ElevatedButton(
    //                   onPressed: () => _openShift(context),
    //                   child: const Text('Mở ca làm việc'),
    //                 ),
    //               ),
    //             ],
    //           ),
    //         ),
    // );
  }
}