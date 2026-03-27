import '../models/charge_item.dart';
import '../models/market_item.dart';
import '../models/shift_info.dart';
import '../models/zone_item.dart';
import 'api_client.dart';

class CollectorService {
  final ApiClient _api = ApiClient();

  Future<ShiftInfo?> getActiveShift() async {
    try {
      final data = await _api.get('/shifts/active');
      if (data == null || data is! Map<String, dynamic> || data.isEmpty) {
        return null;
      }
      return ShiftInfo.fromJson(data);
    } catch (_) {
      return null;
    }
  }

  Future<int> startShift() async {
    final data = await _api.post('/shifts/start');
    return _toInt(data['shift_id']) ?? 0;
  }

  Future<void> endShift(int shiftId) async {
    await _api.post('/shifts/end', body: {'shift_id': shiftId});
  }

  Future<List<MarketItem>> getMarkets() async {
    final response = await _api.get('/markets', query: {
      'limit': '100',
      'page': '1',
    });

    return (response['data'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(MarketItem.fromJson)
        .toList();
  }

  Future<List<ZoneItem>> getZones(int marketId) async {
    final response = await _api.get('/zones', query: {
      'market_id': '$marketId',
      'limit': '100',
      'page': '1',
    });

    return (response['data'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(ZoneItem.fromJson)
        .toList();
  }

  Future<List<ChargeItem>> getCharges({
    String? query,
    String? status,
    int? marketId,
    int? zoneId,
    bool onlyUnpaid = true,
  }) async {
    final response = await _api.get('/charges', query: {
      if (query != null && query.trim().isNotEmpty) 'q': query.trim(),
      if (status != null && status.isNotEmpty) 'trangThai': status,
      if (marketId != null) 'market_id': '$marketId',
      if (zoneId != null) 'zone_id': '$zoneId',
      if (onlyUnpaid) 'only_unpaid': '1',
      'limit': '100',
      'page': '1',
    });

    return (response['data'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(ChargeItem.fromJson)
        .toList();
  }

  Future<void> collectCharge({
    required int chargeId,
    required num amount,
    required String paymentMethod,
    required int shiftId,
    String? note,
    String? imagePath,
    String? collectedAt,
  }) async {
    final now = collectedAt ?? DateTime.now().toIso8601String();

    if (paymentMethod == 'chuyen_khoan' &&
        (imagePath == null || imagePath.trim().isEmpty)) {
      throw Exception('Chuyển khoản phải có ảnh xác nhận.');
    }

    if (imagePath != null && imagePath.trim().isNotEmpty) {
      await _api.postMultipart(
        '/charges/$chargeId/receipts',
        fields: {
          'soTienThu': amount.toString(),
          'hinhThucThanhToan': paymentMethod,
          'ghiChu': note ?? '',
          'thoiGianThu': now,
          'shift_id': shiftId.toString(),
        },
        fileField: 'payment_image',
        filePath: imagePath,
      );
      return;
    }

    await _api.post('/charges/$chargeId/receipts', body: {
      'soTienThu': amount,
      'hinhThucThanhToan': paymentMethod,
      'ghiChu': note,
      'anhChupThanhToan': imagePath,
      'thoiGianThu': now,
      'shift_id': shiftId,
    });
  }

  bool isOfflineError(Object error) => _api.isOfflineError(error);
}

int? _toInt(dynamic value) {
  if (value == null) return null;
  if (value is int) return value;
  return int.tryParse(value.toString());
}
