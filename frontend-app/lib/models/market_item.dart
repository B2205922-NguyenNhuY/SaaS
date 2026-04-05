class MarketItem {
  final int marketId;
  final String name;
  final String address;
  final num? area;
  final String status;

  const MarketItem({
    required this.marketId,
    required this.name,
    required this.address,
    required this.area,
    required this.status,
  });

  factory MarketItem.fromJson(Map<String, dynamic> json) {
    return MarketItem(
      marketId: _toInt(json['market_id']) ?? 0,
      name: (json['tenCho'] ?? '').toString(),
      address: (json['diaChi'] ?? '').toString(),
      area: _toNum(json['dienTich']),
      status: (json['trangThai'] ?? 'active').toString(),
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
