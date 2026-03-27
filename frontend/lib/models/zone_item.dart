class ZoneItem {
  final int zoneId;
  final int marketId;
  final String name;
  final String marketName;
  final String status;

  const ZoneItem({
    required this.zoneId,
    required this.marketId,
    required this.name,
    required this.marketName,
    required this.status,
  });

  factory ZoneItem.fromJson(Map<String, dynamic> json) {
    return ZoneItem(
      zoneId: _toInt(json['zone_id']) ?? 0,
      marketId: _toInt(json['market_id']) ?? 0,
      name: (json['tenKhu'] ?? '').toString(),
      marketName: (json['tenCho'] ?? '').toString(),
      status: (json['trangThai'] ?? 'active').toString(),
    );
  }
}

int? _toInt(dynamic value) {
  if (value == null) return null;
  if (value is int) return value;
  return int.tryParse(value.toString());
}
