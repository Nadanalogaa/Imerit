import 'dart:math';

/// Haversine distance — straight-line km between two coordinates.
double? distanceKm(double? aLat, double? aLng, double? bLat, double? bLng) {
  if (aLat == null || aLng == null || bLat == null || bLng == null) return null;
  const r = 6371.0;
  double toRad(double d) => d * pi / 180;
  final dLat = toRad(bLat - aLat);
  final dLng = toRad(bLng - aLng);
  final sa = sin(dLat / 2);
  final sb = sin(dLng / 2);
  final x = sa * sa + cos(toRad(aLat)) * cos(toRad(bLat)) * sb * sb;
  return ((r * 2 * asin(min(1, sqrt(x)))) * 10).round() / 10;
}

String formatDistance(double? km) {
  if (km == null) return '—';
  if (km < 1) return '${(km * 1000).round()} m away';
  return '$km km away';
}
