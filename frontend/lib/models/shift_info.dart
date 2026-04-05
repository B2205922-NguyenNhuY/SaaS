class ShiftInfo {
  final int shiftId;
  final String startedAt;
  final String? endedAt;
  final num cashTotal;
  final num transferTotal;

  const ShiftInfo({
    required this.shiftId,
    required this.startedAt,
    required this.endedAt,
    required this.cashTotal,
    required this.transferTotal,
  });

  factory ShiftInfo.fromJson(Map<String, dynamic> json) {
    return ShiftInfo(
      shiftId: _toInt(json['shift_id']) ?? 0,
      startedAt: (json['thoiGianBatDauCa'] ?? '').toString(),
      endedAt: json['thoiGianKetThucCa']?.toString(),
      cashTotal: _toNum(json['tongTienMatThuDuoc']) ?? 0,
      transferTotal: _toNum(json['tongChuyenKhoanThuDuoc']) ?? 0,
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
