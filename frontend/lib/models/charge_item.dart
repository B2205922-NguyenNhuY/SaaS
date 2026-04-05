class ChargeItem {
  final int chargeId;
  final int? kioskId;
  final int? merchantId;
  final int? periodId;
  final int? zoneId;
  final int? marketId;
  final num amountDue;
  final num amountPaid;
  final String status;
  final String kioskCode;
  final String merchantName;
  final String periodName;
  final String zoneName;

  const ChargeItem({
    required this.chargeId,
    required this.kioskId,
    required this.merchantId,
    required this.periodId,
    required this.zoneId,
    required this.marketId,
    required this.amountDue,
    required this.amountPaid,
    required this.status,
    required this.kioskCode,
    required this.merchantName,
    required this.periodName,
    required this.zoneName,
  });

  factory ChargeItem.fromJson(Map<String, dynamic> json) {
    return ChargeItem(
      chargeId: _toInt(json['charge_id']) ?? 0,
      kioskId: _toInt(json['kiosk_id']),
      merchantId: _toInt(json['merchant_id']),
      periodId: _toInt(json['period_id']),
      zoneId: _toInt(json['zone_id']),
      marketId: _toInt(json['market_id']),
      amountDue: _toNum(json['soTienPhaiThu']) ?? 0,
      amountPaid: _toNum(json['soTienDaThu']) ?? 0,
      status: (json['trangThai'] ?? 'chua_thu').toString(),
      kioskCode: (json['maKiosk'] ?? '').toString(),
      merchantName: (json['merchantName'] ?? '').toString(),
      periodName: (json['tenKyThu'] ?? '').toString(),
      zoneName: (json['tenKhu'] ?? '').toString(),
    );
  }

  num get remaining {
    final value = amountDue - amountPaid;
    return value < 0 ? 0 : value;
  }

  bool get isDone => status == 'da_thu' || remaining <= 0;

  ChargeItem copyWith({
    num? amountPaid,
    String? status,
  }) {
    return ChargeItem(
      chargeId: chargeId,
      kioskId: kioskId,
      merchantId: merchantId,
      periodId: periodId,
      zoneId: zoneId,
      marketId: marketId,
      amountDue: amountDue,
      amountPaid: amountPaid ?? this.amountPaid,
      status: status ?? this.status,
      kioskCode: kioskCode,
      merchantName: merchantName,
      periodName: periodName,
      zoneName: zoneName,
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
