import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'collector_drawer.dart';

class CollectorHome extends StatefulWidget {
  const CollectorHome({super.key});

  @override
  State<CollectorHome> createState() => _CollectorHomeState();
}

class _CollectorHomeState extends State<CollectorHome> {
  String searchQuery = '';

  Map<String, dynamic>? currentShift = {
    'status': 'đang hoạt động',
    'startTime': DateTime.now().subtract(const Duration(hours: 1)),
    'endTime': null,
    'totalCash': 1200000.0,
    'totalTransfer': 800000.0,
    'transactions': 15,
  };

  final List<Map<String, String>> charges = [
    {'kiosk': 'Kiosk 1', 'status': 'chưa thu'},
    {'kiosk': 'Kiosk 2', 'status': 'đã thu'},
    {'kiosk': 'Kiosk 3', 'status': 'chưa thu'},
    {'kiosk': 'Kiosk 4', 'status': 'đã thu'},
  ];

  @override
  Widget build(BuildContext context) {
    final filteredCharges = charges
        .where((c) =>
            c['kiosk']!.toLowerCase().contains(searchQuery.toLowerCase()))
        .toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text("Collector"),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(60),
          child: Padding(
            padding: const EdgeInsets.all(8.0),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Tìm kiếm kiosk...',
                fillColor: Colors.white,
                filled: true,
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              onChanged: (val) => setState(() => searchQuery = val),
            ),
          ),
        ),
      ),
      drawer: const CollectorDrawer(),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Thông tin ca
            Card(
              color: Colors.blue.shade50,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Trạng thái ca: ${currentShift?['status'] ?? 'chưa bắt đầu'}',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    Text('Bắt đầu: ${currentShift?['startTime'] ?? '-'}'),
                    Text('Kết thúc: ${currentShift?['endTime'] ?? '-'}'),
                    const SizedBox(height: 4),
                    Text(
                      'Tổng tiền thu: ${(currentShift?['totalCash'] ?? 0) + (currentShift?['totalTransfer'] ?? 0)} VND',
                    ),
                    Text('Số lượt thu: ${currentShift?['transactions'] ?? 0}'),
                    const SizedBox(height: 8),
                    ElevatedButton(
                      onPressed: () {},
                      child: Text(
                        currentShift?['status'] == 'chưa bắt đầu'
                            ? 'Bắt đầu ca'
                            : 'Kết thúc ca',
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Danh sách charges
            Expanded(
              child: ListView.builder(
                itemCount: filteredCharges.length,
                itemBuilder: (context, index) {
                  final charge = filteredCharges[index];
                  return Card(
                    child: ListTile(
                      leading: const Icon(Icons.store),
                      title: Text(charge['kiosk']!),
                      subtitle: Text('Trạng thái: ${charge['status']}'),
                      trailing: charge['status'] == 'chưa thu'
                          ? ElevatedButton(
                              onPressed: () {
                                context.push(
                                    '/collector/charge/${charge['kiosk']}');
                              },
                              child: const Text('Thu tiền'),
                            )
                          : null,
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}