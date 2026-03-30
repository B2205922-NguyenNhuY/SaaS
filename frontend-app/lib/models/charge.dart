class Charge {
  final int id;
  final double soTienPhaiThu;
  final double soTienDaThu;
  final String trangThai;

  Charge({
    required this.id,
    required this.soTienPhaiThu,
    required this.soTienDaThu,
    required this.trangThai,
  });

  double get conLai => soTienPhaiThu - soTienDaThu;

  bool get isPaid => trangThai == 'da_thu';
  bool get isDebt => trangThai == 'no';
  bool get isUnpaid => trangThai == 'chua_thu';

  factory Charge.fromJson(Map<String, dynamic> json) {
    return Charge(
      id: json['charge_id'],
      soTienPhaiThu: double.parse(json['soTienPhaiThu'].toString()),
      soTienDaThu: double.parse(json['soTienDaThu'].toString()),
      trangThai: json['trangThai'],
    );
  }
}