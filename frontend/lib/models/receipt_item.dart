class ReceiptItem {
  final int receiptId;
  final num amount;
  final String paymentMethod;
  final String? note;
  final String? paidAt;
  final String? collectorName;

  const ReceiptItem({
    required this.receiptId,
    required this.amount,
    required this.paymentMethod,
    this.note,
    this.paidAt,
    this.collectorName,
  });

  factory ReceiptItem.fromJson(Map<String, dynamic> json) {
    return ReceiptItem(
      receiptId: _toInt(json['receipt_id']) ?? 0,
      amount: num.tryParse('${json['soTienThu'] ?? 0}') ?? 0,
      paymentMethod: (json['hinhThucThanhToan'] ?? '').toString(),
      note: json['ghiChu']?.toString(),
      paidAt: json['thoiGianThu']?.toString(),
      collectorName: json['nhanVienThu']?.toString(),
    );
  }
}

int? _toInt(dynamic value) {
  if (value == null) return null;
  if (value is int) return value;
  return int.tryParse(value.toString());
}
