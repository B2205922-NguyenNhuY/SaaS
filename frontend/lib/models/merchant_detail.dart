class MerchantDetail {
  final int merchantId;
  final String name;
  final String? phone;
  final String? taxCode;
  final String? citizenId;
  final String? address;
  final String status;
  final List<MerchantAssignment> activeAssignments;

  const MerchantDetail({
    required this.merchantId,
    required this.name,
    required this.phone,
    required this.taxCode,
    required this.citizenId,
    required this.address,
    required this.status,
    required this.activeAssignments,
  });

  factory MerchantDetail.fromJson(Map<String, dynamic> json) {
    final rawAssignments =
        json['active_assignments'] as List<dynamic>? ?? const [];
    return MerchantDetail(
      merchantId: _toInt(json['merchant_id']) ?? 0,
      name: (json['hoTen'] ?? '').toString(),
      phone: json['soDienThoai']?.toString(),
      taxCode: json['maSoThue']?.toString(),
      citizenId: json['CCCD']?.toString(),
      address: json['diaChiThuongTru']?.toString(),
      status: (json['trangThai'] ?? '').toString(),
      activeAssignments: rawAssignments
          .whereType<Map<String, dynamic>>()
          .map(MerchantAssignment.fromJson)
          .toList(),
    );
  }
}

class MerchantAssignment {
  final int? assignmentId;
  final int? kioskId;
  final int? zoneId;
  final int? marketId;
  final String kioskCode;
  final String zoneName;
  final String marketName;
  final String? startedAt;

  const MerchantAssignment({
    required this.assignmentId,
    required this.kioskId,
    required this.zoneId,
    required this.marketId,
    required this.kioskCode,
    required this.zoneName,
    required this.marketName,
    required this.startedAt,
  });

  factory MerchantAssignment.fromJson(Map<String, dynamic> json) {
    return MerchantAssignment(
      assignmentId: _toInt(json['assignment_id']),
      kioskId: _toInt(json['kiosk_id']),
      zoneId: _toInt(json['zone_id']),
      marketId: _toInt(json['market_id']),
      kioskCode: (json['maKiosk'] ?? '').toString(),
      zoneName: (json['tenKhu'] ?? '').toString(),
      marketName: (json['tenCho'] ?? '').toString(),
      startedAt: json['ngayBatDau']?.toString(),
    );
  }
}

int? _toInt(dynamic value) {
  if (value == null) return null;
  if (value is int) return value;
  return int.tryParse(value.toString());
}
