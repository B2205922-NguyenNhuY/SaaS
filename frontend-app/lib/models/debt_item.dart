class DebtItem {
  final int chargeId;
  final int? merchantId;
  final int? kioskId;
  final int? zoneId;
  final int? marketId;
  final num amountDue;
  final num amountPaid;
  final num debtAmount;
  final String merchantName;
  final String kioskCode;
  final String zoneName;
  final String periodName;

  const DebtItem({
    required this.chargeId,
    required this.merchantId,
    required this.kioskId,
    required this.zoneId,
    required this.marketId,
    required this.amountDue,
    required this.amountPaid,
    required this.debtAmount,
    required this.merchantName,
    required this.kioskCode,
    required this.zoneName,
    required this.periodName,
  });

  factory DebtItem.fromJson(Map<String, dynamic> json) {
    return DebtItem(
      chargeId: _toInt(json['charge_id']) ?? 0,
      merchantId: _toInt(json['merchant_id']),
      kioskId: _toInt(json['kiosk_id']),
      zoneId: _toInt(json['zone_id']),
      marketId: _toInt(json['market_id']),
      amountDue: _toNum(json['soTienPhaiThu']) ?? 0,
      amountPaid: _toNum(json['soTienDaThu']) ?? 0,
      debtAmount: _toNum(json['soTienNo']) ?? 0,
      merchantName: (json['hoTen'] ?? '').toString(),
      kioskCode: (json['maKiosk'] ?? '').toString(),
      zoneName: (json['tenKhu'] ?? '').toString(),
      periodName: (json['tenKyThu'] ?? '').toString(),
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
