import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/charge_item.dart';
import '../models/market_item.dart';
import '../models/shift_info.dart';
import '../models/zone_item.dart';
import '../services/collector_service.dart';

class CollectorProvider extends ChangeNotifier {
  CollectorProvider({CollectorService? service})
      : _service = service ?? CollectorService();

  static const String _pendingReceiptsKey = 'collector_pending_receipts';

  final CollectorService _service;

  bool loading = false;
  bool syncing = false;
  bool initialized = false;
  String? errorMessage;

  List<MarketItem> markets = <MarketItem>[];
  List<ZoneItem> zones = <ZoneItem>[];
  List<ChargeItem> charges = <ChargeItem>[];
  List<Map<String, dynamic>> pendingReceipts = <Map<String, dynamic>>[];

  MarketItem? selectedMarket;
  ZoneItem? selectedZone;
  ShiftInfo? activeShift;

  String searchQuery = '';
  String statusFilter = '';

  bool get canCollect => activeShift != null;
  bool get canGoBack => selectedZone != null || selectedMarket != null;
  bool get isMarketStep => selectedMarket == null;
  bool get isZoneStep => selectedMarket != null && selectedZone == null;
  bool get isChargeStep => selectedMarket != null && selectedZone != null;

  int get openChargeCount => charges
      .where((item) => item.status == 'chua_thu' || item.status == 'no')
      .length;

  num get totalRemaining =>
      charges.fold<num>(0, (sum, item) => sum + item.remaining);

  String get title {
    if (selectedZone != null) {
      return '${selectedMarket?.name ?? 'Chợ'} / ${selectedZone?.name ?? 'Khu'}';
    }
    if (selectedMarket != null) {
      return selectedMarket!.name;
    }
    return 'Chọn chợ';
  }

  Future<void> init() async {
    if (initialized) return;
    initialized = true;
    await _restorePendingReceipts();
    await refreshAll(showLoading: true);
  }

  Future<void> refreshAll({bool showLoading = false}) async {
    errorMessage = null;
    if (showLoading) {
      loading = true;
      notifyListeners();
    }

    try {
      await loadActiveShift();
      await loadMarkets();

      if (selectedMarket != null) {
        final stillExists =
            markets.any((m) => m.marketId == selectedMarket!.marketId);
        if (!stillExists) {
          selectedMarket = null;
          selectedZone = null;
          zones = <ZoneItem>[];
          charges = <ChargeItem>[];
        } else {
          selectedMarket =
              markets.firstWhere((m) => m.marketId == selectedMarket!.marketId);
          await loadZones(notify: false);
        }
      }

      if (selectedZone != null) {
        final stillExists = zones.any((z) => z.zoneId == selectedZone!.zoneId);
        if (!stillExists) {
          selectedZone = null;
          charges = <ChargeItem>[];
        } else {
          selectedZone =
              zones.firstWhere((z) => z.zoneId == selectedZone!.zoneId);
          await loadCharges(notify: false);
        }
      }
    } catch (e) {
      errorMessage = _cleanError(e);
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> loadActiveShift() async {
    activeShift = await _service.getActiveShift();
  }

  Future<void> loadMarkets() async {
    markets = await _service.getMarkets();
  }

  Future<void> selectMarket(MarketItem market) async {
    selectedMarket = market;
    selectedZone = null;
    zones = <ZoneItem>[];
    charges = <ChargeItem>[];
    errorMessage = null;
    loading = true;
    notifyListeners();

    try {
      await loadZones(notify: false);
    } catch (e) {
      errorMessage = _cleanError(e);
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> loadZones({bool notify = true}) async {
    if (selectedMarket == null) {
      zones = <ZoneItem>[];
      if (notify) notifyListeners();
      return;
    }

    zones = await _service.getZones(selectedMarket!.marketId);
    if (notify) notifyListeners();
  }

  Future<void> selectZone(ZoneItem zone) async {
    selectedZone = zone;
    charges = <ChargeItem>[];
    searchQuery = '';
    statusFilter = '';
    errorMessage = null;
    loading = true;
    notifyListeners();

    try {
      await loadCharges(notify: false);
    } catch (e) {
      errorMessage = _cleanError(e);
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> loadCharges({bool notify = true}) async {
    if (selectedZone == null) {
      charges = <ChargeItem>[];
      if (notify) notifyListeners();
      return;
    }

    charges = await _service.getCharges(
      query: searchQuery,
      status: statusFilter,
      marketId: selectedMarket?.marketId,
      zoneId: selectedZone?.zoneId,
      onlyUnpaid: statusFilter.isEmpty,
    );

    if (notify) notifyListeners();
  }

  Future<void> applyFilters({String? newSearch, String? newStatus}) async {
    searchQuery = newSearch ?? searchQuery;
    statusFilter = newStatus ?? statusFilter;
    if (selectedZone == null) return;

    loading = true;
    errorMessage = null;
    notifyListeners();

    try {
      await loadCharges(notify: false);
    } catch (e) {
      errorMessage = _cleanError(e);
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  void backStep() {
    errorMessage = null;

    if (selectedZone != null) {
      selectedZone = null;
      charges = <ChargeItem>[];
      searchQuery = '';
      statusFilter = '';
    } else if (selectedMarket != null) {
      selectedMarket = null;
      selectedZone = null;
      zones = <ZoneItem>[];
      charges = <ChargeItem>[];
      searchQuery = '';
      statusFilter = '';
    }

    notifyListeners();
  }

  Future<void> startShift() async {
    loading = true;
    errorMessage = null;
    notifyListeners();

    try {
      await _service.startShift();
      await loadActiveShift();
    } catch (e) {
      errorMessage = _cleanError(e);
      rethrow;
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<void> endShift() async {
    if (activeShift == null) {
      throw Exception('Hiện chưa có ca đang mở.');
    }

    if (pendingReceipts.isNotEmpty) {
      throw Exception(
        'Còn biên lai offline chưa đồng bộ. Hãy đồng bộ xong rồi mới kết ca.',
      );
    }

    loading = true;
    errorMessage = null;
    notifyListeners();

    try {
      await _service.endShift(activeShift!.shiftId);
      activeShift = null;
    } catch (e) {
      errorMessage = _cleanError(e);
      rethrow;
    } finally {
      loading = false;
      notifyListeners();
    }
  }

  Future<String> collectCharge({
    required ChargeItem charge,
    required num amount,
    required String paymentMethod,
    String? note,
    String? imagePath,
  }) async {
    if (activeShift == null) {
      throw Exception('Bạn phải mở ca trước khi thu phí.');
    }

    if (amount <= 0) {
      throw Exception('Số tiền phải lớn hơn 0.');
    }

    if (amount > charge.remaining) {
      throw Exception('Số tiền thu vượt quá số tiền còn lại.');
    }

    if (paymentMethod == 'chuyen_khoan' &&
        (imagePath == null || imagePath.trim().isEmpty)) {
      throw Exception('Chuyển khoản phải có ảnh xác nhận.');
    }

    final now = DateTime.now().toIso8601String();

    final payload = <String, dynamic>{
      'charge_id': charge.chargeId,
      'soTienThu': amount,
      'hinhThucThanhToan': paymentMethod,
      'ghiChu': note,
      'anhChupThanhToan': imagePath,
      'thoiGianThu': now,
      'shift_id': activeShift!.shiftId,
      'meta': {
        'kioskCode': charge.kioskCode,
        'merchantName': charge.merchantName,
        'periodName': charge.periodName,
      },
    };

    try {
      await _service.collectCharge(
        chargeId: charge.chargeId,
        amount: amount,
        paymentMethod: paymentMethod,
        shiftId: activeShift!.shiftId,
        note: note,
        imagePath: imagePath,
        collectedAt: now,
      );

      _applyLocalChargePayment(charge.chargeId, amount);
      await loadActiveShift();
      notifyListeners();
      return 'online';
    } catch (e) {
      if (!_service.isOfflineError(e)) {
        rethrow;
      }

      pendingReceipts.insert(0, payload);
      await _persistPendingReceipts();

      _applyLocalChargePayment(charge.chargeId, amount);
      errorMessage =
          'Mất kết nối. Biên lai đã được lưu offline và sẽ đồng bộ sau.';
      notifyListeners();
      return 'offline';
    }
  }

  Future<void> syncPendingReceipts() async {
    if (pendingReceipts.isEmpty) return;

    syncing = true;
    errorMessage = null;
    notifyListeners();

    final remaining = <Map<String, dynamic>>[];

    try {
      for (final item in pendingReceipts) {
        try {
          await _service.collectCharge(
            chargeId: _toInt(item['charge_id']) ?? 0,
            amount: _toNum(item['soTienThu']) ?? 0,
            paymentMethod: (item['hinhThucThanhToan'] ?? 'tien_mat').toString(),
            shiftId: _toInt(item['shift_id']) ?? 0,
            note: item['ghiChu']?.toString(),
            imagePath: item['anhChupThanhToan']?.toString(),
            collectedAt: item['thoiGianThu']?.toString(),
          );
        } catch (e) {
          remaining.add(item);

          if (!_service.isOfflineError(e)) {
            errorMessage = _cleanError(e);
          }
        }
      }

      pendingReceipts = remaining;
      await _persistPendingReceipts();
      await loadActiveShift();

      if (selectedZone != null) {
        await loadCharges(notify: false);
      }
    } finally {
      syncing = false;
      notifyListeners();
    }
  }

  void _applyLocalChargePayment(int chargeId, num amount) {
    charges = charges.map((item) {
      if (item.chargeId != chargeId) return item;

      final newPaid = item.amountPaid + amount;
      final cappedPaid = newPaid > item.amountDue ? item.amountDue : newPaid;
      final newStatus = cappedPaid >= item.amountDue ? 'da_thu' : 'no';

      return item.copyWith(
        amountPaid: cappedPaid,
        status: newStatus,
      );
    }).toList();
  }

  Future<void> _restorePendingReceipts() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getStringList(_pendingReceiptsKey) ?? const <String>[];

    pendingReceipts = raw
        .map((item) {
          try {
            final decoded = jsonDecode(item);
            return decoded is Map<String, dynamic> ? decoded : null;
          } catch (_) {
            return null;
          }
        })
        .whereType<Map<String, dynamic>>()
        .toList();
  }

  Future<void> _persistPendingReceipts() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(
      _pendingReceiptsKey,
      pendingReceipts.map(jsonEncode).toList(),
    );
  }

  String _cleanError(Object error) {
    return error.toString().replaceFirst('Exception: ', '').trim();
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
