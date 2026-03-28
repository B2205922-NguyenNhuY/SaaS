import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

class CollectorCacheService {
  static const _marketsKey = 'collector_cache_markets';
  static const _zonesPrefix = 'collector_cache_zones_';
  static const _chargesPrefix = 'collector_cache_charges_';

  Future<void> saveMarkets(List<Map<String, dynamic>> items) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_marketsKey, jsonEncode(items));
  }

  Future<List<Map<String, dynamic>>> getMarkets() async {
    final prefs = await SharedPreferences.getInstance();
    return _decodeList(prefs.getString(_marketsKey));
  }

  Future<void> saveZones(int marketId, List<Map<String, dynamic>> items) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('$_zonesPrefix$marketId', jsonEncode(items));
  }

  Future<List<Map<String, dynamic>>> getZones(int marketId) async {
    final prefs = await SharedPreferences.getInstance();
    return _decodeList(prefs.getString('$_zonesPrefix$marketId'));
  }

  Future<void> saveCharges(
      String cacheKey, List<Map<String, dynamic>> items) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('$_chargesPrefix$cacheKey', jsonEncode(items));
  }

  Future<List<Map<String, dynamic>>> getCharges(String cacheKey) async {
    final prefs = await SharedPreferences.getInstance();
    return _decodeList(prefs.getString('$_chargesPrefix$cacheKey'));
  }

  List<Map<String, dynamic>> _decodeList(String? raw) {
    if (raw == null || raw.isEmpty) return const [];
    try {
      final decoded = jsonDecode(raw);
      if (decoded is! List) return const [];
      return decoded.whereType<Map<String, dynamic>>().toList();
    } catch (_) {
      return const [];
    }
  }
}
