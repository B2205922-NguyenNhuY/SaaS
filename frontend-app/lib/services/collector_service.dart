import '../models/charge_item.dart';
import '../models/debt_item.dart';
import '../models/market_item.dart';
import '../models/merchant_detail.dart';
import '../models/notification_item.dart';
import '../models/receipt_detail.dart';
import '../models/receipt_item.dart';
import '../models/shift_info.dart';
import '../models/zone_item.dart';
import 'api_client.dart';
import 'dart:convert';

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

  Future<List<ShiftInfo>> getShifts({
    int page = 1,
    int limit = 30,
    bool mine = true,
    String? fromDate,
    String? toDate,
  }) async {
    final response = await _api.get('/shifts', query: {
      'page': '$page',
      'limit': '$limit',
      if (mine) 'mine': '1',
      if ((fromDate ?? '').isNotEmpty) 'from_date': fromDate!,
      if ((toDate ?? '').isNotEmpty) 'to_date': toDate!,
    });

    return (response['data'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(ShiftInfo.fromJson)
        .toList();
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
    bool onlyUnpaid = false,
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

  Future<List<DebtItem>> getDebts({
    String? query,
    int? marketId,
    int? zoneId,
    int? merchantId,
    int page = 1,
    int limit = 100,
  }) async {
    final response = await _api.get('/debts', query: {
      'page': '$page',
      'limit': '$limit',
      if ((query ?? '').trim().isNotEmpty) 'q': query!.trim(),
      if (marketId != null) 'market_id': '$marketId',
      if (zoneId != null) 'zone_id': '$zoneId',
      if (merchantId != null) 'merchant_id': '$merchantId',
    });

    return (response['data'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(DebtItem.fromJson)
        .toList();
  }

  Future<List<ReceiptItem>> getReceipts({
    String? query,
    String? paymentMethod,
    int? shiftId,
    int? chargeId,
    int? merchantId,
    String? fromDate,
    String? toDate,
    int page = 1,
    int limit = 100,
  }) async {
    final response = await _api.get('/receipts', query: {
      'page': '$page',
      'limit': '$limit',
      if (merchantId != null) 'merchant_id': '$merchantId', // 👈 QUAN TRỌNG
      if ((query ?? '').trim().isNotEmpty) 'q': query!.trim(),
      if ((paymentMethod ?? '').isNotEmpty) 'hinhThucThanhToan': paymentMethod!,
      if (shiftId != null) 'shift_id': '$shiftId',
      if (chargeId != null) 'charge_id': '$chargeId',
      if ((fromDate ?? '').isNotEmpty) 'from_date': fromDate!,
      if ((toDate ?? '').isNotEmpty) 'to_date': toDate!,
    });

    return (response['data'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(ReceiptItem.fromJson)
        .toList();
  }

  Future<ReceiptDetail> getReceiptDetail(int receiptId) async {
    final data = await _api.get('/receipts/$receiptId');
    return ReceiptDetail.fromJson(data as Map<String, dynamic>);
  }

  Future<MerchantDetail> getMerchantDetail(int merchantId) async {
    final data = await _api.get('/merchant/$merchantId');
    return MerchantDetail.fromJson(data as Map<String, dynamic>);
  }

  Future<List<NotificationItem>> getNotifications(
      {int page = 1, int limit = 50}) async {
    final response = await _api.get('/notifications', query: {
      'page': '$page',
      'limit': '$limit',
    });
    return (response['data'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(NotificationItem.fromJson)
        .toList();
  }

  Future<int> getUnreadNotificationCount() async {
    final data = await _api.get('/notifications/unread_count');
    return _toInt(data['unread_count']) ?? 0;
  }

  Future<NotificationItem> getNotificationDetail(int id) async {
    final data = await _api.get('/notifications/$id');
    return NotificationItem.fromJson(data as Map<String, dynamic>);
  }

  Future<void> markNotificationRead(int id) async {
    await _api.post('/notifications/$id/read');
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
          'charges': jsonEncode([
            {
              'charge_id': chargeId,
              'amount': amount,
            }
          ]),
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
      'charges': [
        {
          'charge_id': chargeId,
          'amount': amount, // ✅ đổi từ soTien → amount
        }
      ]
    });
  }

  bool isOfflineError(Object error) => _api.isOfflineError(error);
}

int? _toInt(dynamic value) {
  if (value == null) return null;
  if (value is int) return value;
  return int.tryParse(value.toString());
}
