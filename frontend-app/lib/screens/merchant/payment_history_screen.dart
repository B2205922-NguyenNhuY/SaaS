import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/payment_provider.dart';
import '../../core/utils/ui_helpers.dart';

class PaymentHistoryScreen extends StatefulWidget {
  const PaymentHistoryScreen({super.key});

  @override
  State<PaymentHistoryScreen> createState() =>
      _PaymentHistoryScreenState();
}

class _PaymentHistoryScreenState extends State<PaymentHistoryScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      context.read<PaymentProvider>().fetchReceipts();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PaymentProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text("Lịch sử thanh toán")),

      body: Column(
        children: [

          /// ===== FILTER =====
          _buildFilter(provider),

          /// ===== LIST =====
          Expanded(
            child: provider.isLoading
                ? const Center(child: CircularProgressIndicator())
                : ListView.builder(
                    itemCount: provider.filteredReceipts.length,
                    itemBuilder: (context, index) {
                      final r = provider.filteredReceipts[index];
                      return _receiptItem(context, r);
                    },
                  ),
          )
        ],
      ),
    );
  }

  // ===== FILTER UI =====
  Widget _buildFilter(PaymentProvider provider) {
    return Padding(
      padding: const EdgeInsets.all(8),
      child: DropdownButton<String>(
        value: provider.filter,
        isExpanded: true,
        items: const [
          DropdownMenuItem(value: "all", child: Text("Tất cả")),
          DropdownMenuItem(value: "Tiền mặt", child: Text("Tiền mặt")),
          DropdownMenuItem(value: "Chuyển khoản", child: Text("Chuyển khoản")),
        ],
        onChanged: (v) {
          if (v != null) provider.setFilter(v);
        },
      ),
    );
  }

  // ===== RECEIPT ITEM =====
  Widget _receiptItem(BuildContext context, Map<String, dynamic> r) {
    final provider = context.watch<PaymentProvider>();
    
    return ExpansionTile(
      title: Text("${UIHelpers.formatMoney(r['amount'])} đ"),
      subtitle: Text("${r['method']} • ${UIHelpers.formatDate(r['date'])}"),

      trailing: const Icon(Icons.expand_more),

      onExpansionChanged: (expanded) {
        if (expanded) {
          provider.fetchReceiptDetail(r['id']);
        }
      },

      children: [
        Consumer<PaymentProvider>(
          builder: (_, p, __) {
            final details = p.receiptDetails[r['id']];

            if (details == null) {
              return const Padding(
                padding: EdgeInsets.all(12),
                child: CircularProgressIndicator(),
              );
            }

            if (details.isEmpty) {
              return const Padding(
                padding: EdgeInsets.all(12),
                child: Text("Không có chi tiết"),
              );
            }

            return Column(
              children: details.map((d) {
                double paid = double.tryParse(d['amount'].toString()) ?? 0;
                double price = double.tryParse(d['price'].toString()) ?? 0;
                double totalPaid = double.tryParse(d['totalPaid'].toString()) ?? 0;
                String statusText;
                Color statusColor;

                if (paid == 0) {
                  statusText = "Chưa thanh toán";
                  statusColor = Colors.red;
                } else if (totalPaid < price) {
                  statusText = "Còn nợ ${UIHelpers.formatMoney(price - totalPaid)}đ";
                  statusColor = Colors.red;
                } else {
                  statusText = "Đã thanh toán";
                  statusColor = Colors.green;
                }
                return Container(
                  margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [

                      /// 🏪 + BADGE
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            d['kiosk'],
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                            ),
                          ),

                          UIHelpers.statusBadge(
                            text: statusText,
                            color: statusColor,
                          ),
                        ],
                      ),

                      const SizedBox(height: 4),

                      /// 📅 Kỳ thu
                      Text(
                        d['period'],
                        style: const TextStyle(color: Colors.grey),
                      ),

                      const SizedBox(height: 8),

                      /// 💰 tiền
                      _rowDetail("Tiền gốc khoản phí:", "${UIHelpers.formatMoney(price)} đ"),
                      _rowDetail("Hóa đơn này chi trả:", "${UIHelpers.formatMoney(paid)} đ", isHighlight: true),
                    ],
                  ),
                );
              }).toList(),
            );


          },
        )
      ],
    );
  }

  Widget _rowDetail(String label, String value, {bool isHighlight = false}) {
  return Padding(
    padding: const EdgeInsets.symmetric(vertical: 2),
    child: Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13)),
        Text(
          value,
          style: TextStyle(
            fontWeight: isHighlight ? FontWeight.bold : FontWeight.normal,
            color: isHighlight ? Colors.blue.shade700 : Colors.black87,
            fontSize: 13,
          ),
        ),
      ],
    ),
  );
}
}