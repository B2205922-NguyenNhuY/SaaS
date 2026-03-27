class ReceiptItem {
  final int receiptId;
  final num amount;
  final String paymentMethod;
  final String? note;
  final String? paidAt;

  const ReceiptItem({
    required this.receiptId,
    required this.amount,
    required this.paymentMethod,
    this.note,
    this.paidAt,
  });

  factory ReceiptItem.fromJson(Map<String, dynamic> json) {
    return ReceiptItem(
      receiptId: json['receipt_id'] as int,
      amount: num.tryParse('${json['soTienThu'] ?? 0}') ?? 0,
      paymentMethod: (json['hinhThucThanhToan'] ?? '').toString(),
      note: json['ghiChu']?.toString(),
      paidAt: json['thoiGianThu']?.toString(),
    );
  }
}
