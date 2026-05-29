// Haversine distance — straight-line km between two coordinates.
export function distanceKm(
  a: { lat: number; lng: number } | undefined | null,
  b: { lat: number; lng: number } | undefined | null
): number | null {
  if (!a || !b || a.lat == null || b.lat == null) return null;
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sa = Math.sin(dLat / 2);
  const sb = Math.sin(dLng / 2);
  const x = sa * sa + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sb * sb;
  return Math.round(R * 2 * Math.asin(Math.min(1, Math.sqrt(x))) * 10) / 10;
}

export function formatDistance(km: number | null): string {
  if (km == null) return "—";
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  return `${km} km away`;
}
