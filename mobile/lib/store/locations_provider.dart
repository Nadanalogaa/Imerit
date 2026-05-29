import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

@immutable
class Taluk {
  const Taluk({
    required this.id,
    required this.name,
    this.nameTa = '',
    required this.lat,
    required this.lng,
    this.pincodes = const [],
  });
  final String id;
  final String name;
  final String nameTa;
  final double lat;
  final double lng;
  final List<String> pincodes;
}

@immutable
class District {
  const District({
    required this.id,
    required this.name,
    this.nameTa = '',
    this.synonyms = const [],
    required this.lat,
    required this.lng,
    this.taluks = const [],
  });
  final String id;
  final String name;
  final String nameTa;
  final List<String> synonyms;
  final double lat;
  final double lng;
  final List<Taluk> taluks;
}

/// Full TN dataset row: district id, representative post office, coords.
/// Public because it appears in the `LocationsData` constructor signature;
/// callers should still treat it as opaque and use `resolvePincode()`.
@immutable
class PincodeRow {
  const PincodeRow({required this.district, required this.office, this.lat, this.lng});
  final String district;
  final String office;
  final double? lat;
  final double? lng;
}

/// Result of a wider pincode lookup against the full TN dataset.
@immutable
class PincodeResolution {
  const PincodeResolution({
    required this.district,
    this.taluk,
    required this.lat,
    required this.lng,
    this.office,
  });
  final District district;
  /// If null, only the district is known and the user must pick the taluk.
  final Taluk? taluk;
  final double lat;
  final double lng;
  final String? office;
}

@immutable
class LocationsData {
  const LocationsData({
    this.districts = const [],
    Map<String, PincodeRow> pincodes = const {},
    this.loaded = false,
  }) : _pincodes = pincodes;
  final List<District> districts;
  /// Full TN pincode dataset — 2040 entries. Keyed by 6-digit pincode.
  /// Private because the underlying row type is an implementation detail;
  /// callers should reach the data through `resolvePincode()`.
  final Map<String, PincodeRow> _pincodes;
  final bool loaded;

  District? districtById(String id) {
    for (final d in districts) {
      if (d.id == id) return d;
    }
    return null;
  }

  ({Taluk taluk, District district})? talukById(String id) {
    for (final d in districts) {
      for (final t in d.taluks) {
        if (t.id == id) return (taluk: t, district: d);
      }
    }
    return null;
  }

  ({Taluk taluk, District district})? talukByPincode(String pincode) {
    if (!RegExp(r'^\d{6}$').hasMatch(pincode)) return null;
    for (final d in districts) {
      for (final t in d.taluks) {
        if (t.pincodes.contains(pincode)) return (taluk: t, district: d);
      }
    }
    return null;
  }

  /// Wider pincode lookup — consults the full TN dataset so any valid TN
  /// pincode resolves to at least its district + coords. Prefer this over
  /// `talukByPincode` in new UI.
  PincodeResolution? resolvePincode(String pincode) {
    if (!RegExp(r'^\d{6}$').hasMatch(pincode)) return null;
    // 1. Exact taluk hit in the hand-curated seed wins.
    final exact = talukByPincode(pincode);
    if (exact != null) {
      return PincodeResolution(
        district: exact.district,
        taluk: exact.taluk,
        lat: exact.taluk.lat,
        lng: exact.taluk.lng,
      );
    }
    // 2. Fall back to the full TN dataset.
    final row = _pincodes[pincode];
    if (row == null) return null;
    final d = districtById(row.district);
    if (d == null) return null;
    return PincodeResolution(
      district: d,
      lat: row.lat ?? d.lat,
      lng: row.lng ?? d.lng,
      office: row.office,
    );
  }

  List<Taluk> taluksOf(String districtId) =>
      districtById(districtId)?.taluks ?? const [];
}

/// A "place" record — the data we store in profiles/jobs.
@immutable
class PlaceRef {
  const PlaceRef({
    this.districtId,
    this.talukId,
    this.lat,
    this.lng,
    this.pincode,
    this.street,
  });
  final String? districtId;
  final String? talukId;
  final double? lat;
  final double? lng;
  final String? pincode;
  final String? street;

  bool get isSet => districtId != null && talukId != null;

  /// Display label like "Sholinganallur · Chennai" — never includes street.
  String publicLabel(LocationsData data) {
    if (talukId == null) return '—';
    final found = data.talukById(talukId!);
    if (found == null) return '—';
    return '${found.taluk.name} · ${found.district.name}';
  }

  PlaceRef copyWith({
    String? districtId,
    String? talukId,
    double? lat,
    double? lng,
    String? pincode,
    String? street,
  }) =>
      PlaceRef(
        districtId: districtId ?? this.districtId,
        talukId: talukId ?? this.talukId,
        lat: lat ?? this.lat,
        lng: lng ?? this.lng,
        pincode: pincode ?? this.pincode,
        street: street ?? this.street,
      );
}

class LocationsNotifier extends Notifier<LocationsData> {
  @override
  LocationsData build() => const LocationsData();

  Future<void> load() async {
    final raw = await rootBundle.loadString('assets/data/locations.json');
    final json = jsonDecode(raw) as Map<String, dynamic>;
    final districts = (json['districts'] as List<dynamic>).map((d) {
      final m = d as Map<String, dynamic>;
      return District(
        id: m['id'] as String,
        name: m['name'] as String,
        nameTa: (m['nameTa'] as String?) ?? '',
        synonyms: ((m['synonyms'] as List<dynamic>?) ?? const []).cast<String>(),
        lat: (m['lat'] as num).toDouble(),
        lng: (m['lng'] as num).toDouble(),
        taluks: ((m['taluks'] as List<dynamic>?) ?? const []).map((t) {
          final tm = t as Map<String, dynamic>;
          return Taluk(
            id: tm['id'] as String,
            name: tm['name'] as String,
            nameTa: (tm['nameTa'] as String?) ?? '',
            lat: (tm['lat'] as num).toDouble(),
            lng: (tm['lng'] as num).toDouble(),
            pincodes: ((tm['pincodes'] as List<dynamic>?) ?? const []).cast<String>(),
          );
        }).toList(),
      );
    }).toList();

    // Full TN pincode dataset — 2040 entries sourced from India Post.
    // Same compact format as the web bundle (d, o, lat, lng).
    Map<String, PincodeRow> pincodes = const {};
    try {
      final pinRaw = await rootBundle.loadString('assets/data/tn-pincodes.json');
      final pinJson = jsonDecode(pinRaw) as Map<String, dynamic>;
      pincodes = pinJson.map((pin, v) {
        final m = v as Map<String, dynamic>;
        return MapEntry(
          pin,
          PincodeRow(
            district: m['d'] as String,
            office: (m['o'] as String?) ?? '',
            lat: (m['lat'] as num?)?.toDouble(),
            lng: (m['lng'] as num?)?.toDouble(),
          ),
        );
      });
    } catch (_) {
      // Asset not present in older builds — fall back to seeded-only lookup.
    }

    state = LocationsData(districts: districts, pincodes: pincodes, loaded: true);
  }
}

final locationsProvider =
    NotifierProvider<LocationsNotifier, LocationsData>(LocationsNotifier.new);
