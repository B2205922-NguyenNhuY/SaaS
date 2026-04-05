class ReceiptDetail {
  final ReceiptInfo receipt;
  final List<ReceiptChargeLine> charges;

  const ReceiptDetail({required this.receipt, required this.charges});

  factory ReceiptDetail.fromJson(Map<String, dynamic> json) {
    final rawCharges = json['charges'] as List<dynamic>? ?? const [];
    return ReceiptDetail(
      receipt: ReceiptInfo.fromJson(
          json['receipt'] as Map<String, dynamic>? ?? const {}),
      charges: rawCharges
          .whereType<Map<String, dynamic>>()
          .map(ReceiptChargeLine.fromJson)
          .toList(),
    );
  }
}

class ReceiptInfo {
  final int receiptId;
  final num amount;
  final String paymentMethod;
  final String? note;
  final String? imageUrl;
  final String? paidAt;
  final String? collectorName;

  const ReceiptInfo({
    required this.receiptId,
    required this.amount,
    required this.paymentMethod,
    required this.note,
    required this.imageUrl,
    required this.paidAt,
    required this.collectorName,
  });

  factory ReceiptInfo.fromJson(Map<String, dynamic> json) {
    return ReceiptInfo(
      receiptId: _toInt(json['receipt_id']) ?? 0,
      amount: _toNum(json['soTienThu']) ?? 0,
      paymentMethod: (json['hinhThucThanhToan'] ?? '').toString(),
      note: json['ghiChu']?.toString(),
      imageUrl: json['anhChupThanhToan']?.toString(),
      paidAt: json['thoiGianThu']?.toString(),
      collectorName: json['nhanVienThu']?.toString(),
    );
  }
}

class ReceiptChargeLine {
  final int chargeId;
  final String kiosk;
  final String merchant;
  final String periodName;
  final String feeName;
  final num amountDue;
  final num amountPaid;

  const ReceiptChargeLine({
    required this.chargeId,
    required this.kiosk,
    required this.merchant,
    required this.periodName,
    required this.feeName,
    required this.amountDue,
    required this.amountPaid,
  });

  factory ReceiptChargeLine.fromJson(Map<String, dynamic> json) {
    return ReceiptChargeLine(
      chargeId: _toInt(json['charge_id']) ?? 0,
      kiosk: (json['kiosk'] ?? '').toString(),
      merchant: (json['merchant'] ?? '').toString(),
      periodName: (json['kyThu'] ?? '').toString(),
      feeName: (json['bieuPhi'] ?? '').toString(),
      amountDue: _toNum(json['soTienPhaiThu']) ?? 0,
      amountPaid: _toNum(json['soTienDaTra']) ?? 0,
    );
  }
}

int? _toInt(dynamic value) {
  if (value == null) return null;
  if (value is int) return value;
  return int.tryParse(value.toString());
}

num? _toNum(dynamic value) {
  if (value == null) return null;
  if (value is num) return value;
  return num.tryParse(value.toString());
}
