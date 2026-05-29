import { create } from "zustand";
import locationsData from "../data/locations.json";
import tnPincodesData from "../data/tn-pincodes.json";

/**
 * Full Tamil Nadu pincode dataset — 2040 unique pincodes mapped to internal
 * district IDs (sourced from India Post's official directory, see
 * https://github.com/dropdevrahul/pincodes-india). Used as the fallback for
 * `resolvePincode()` when no exact taluk match exists in `locations.json`.
 *
 * Compact field names to keep the JSON small:
 *   d   – internal district id (e.g. "tiruchirappalli")
 *   o   – representative post office name (e.g. "Edamalaipatti Pudur SO")
 *   lat – averaged latitude of all post offices sharing this pincode
 *   lng – averaged longitude
 */
interface PincodeRow {
  d: string;
  o: string;
  lat?: number;
  lng?: number;
}
const pincodeMap = tnPincodesData as Record<string, PincodeRow>;

export interface Taluk {
  id: string;
  name: string;
  nameTa?: string;
  lat: number;
  lng: number;
  pincodes: string[];
}

export interface District {
  id: string;
  name: string;
  nameTa?: string;
  synonyms?: string[];
  lat: number;
  lng: number;
  taluks: Taluk[];
}

export interface LocationsFile {
  version: string;
  lastUpdated: string;
  state: string;
  districts: District[];
}

const data = locationsData as LocationsFile;

/** Result of a wider pincode lookup against the full TN dataset. */
export interface PincodeResolution {
  district: District;
  /** Best taluk match within the district from existing seeds — undefined if
   *  the pincode wasn't in our hand-curated lists and we only know the
   *  district. The picker leaves the taluk dropdown open for the user. */
  taluk?: Taluk;
  /** Coordinates of the post office (or its dedupe-mean when multiple offices
   *  share the pincode). Use this for distance scoring; falls back to the
   *  district centre if missing. */
  lat: number;
  lng: number;
  /** Representative post office name (purely informational). */
  office?: string;
}

interface LocationsState {
  data: LocationsFile;
  districts: District[];
  districtById: (id: string) => District | undefined;
  talukById: (id: string) => { taluk: Taluk; district: District } | undefined;
  talukByPincode: (pincode: string) => { taluk: Taluk; district: District } | undefined;
  /**
   * Wider pincode lookup — consults the full TN dataset and always returns
   * coordinates even when the pincode wasn't in the hand-curated per-taluk
   * lists. Prefer this over `talukByPincode` in new UI.
   */
  resolvePincode: (pincode: string) => PincodeResolution | undefined;
  taluksOf: (districtId: string) => Taluk[];
  searchDistricts: (query: string) => District[];
}

export const useLocations = create<LocationsState>(() => ({
  data,
  districts: data.districts,
  districtById: (id) => data.districts.find((d) => d.id === id),
  talukById: (id) => {
    for (const d of data.districts) {
      const t = d.taluks.find((t) => t.id === id);
      if (t) return { taluk: t, district: d };
    }
    return undefined;
  },
  talukByPincode: (pincode) => {
    const code = pincode.trim();
    if (!/^\d{6}$/.test(code)) return undefined;
    for (const d of data.districts) {
      for (const t of d.taluks) {
        if (t.pincodes.includes(code)) return { taluk: t, district: d };
      }
    }
    return undefined;
  },
  resolvePincode: (pincode) => {
    const code = pincode.trim();
    if (!/^\d{6}$/.test(code)) return undefined;

    // 1. Exact taluk hit in our hand-curated dataset wins — the seeded
    //    taluk has its own lat/lng which is more useful than the post-office
    //    centroid we get from the full dataset.
    for (const d of data.districts) {
      for (const t of d.taluks) {
        if (t.pincodes.includes(code)) {
          return { district: d, taluk: t, lat: t.lat, lng: t.lng };
        }
      }
    }

    // 2. Fall back to the full TN dataset — gives us district + coords even
    //    when the pincode wasn't in any seeded taluk list. The user picks the
    //    correct taluk manually from the now-populated dropdown.
    const row = pincodeMap[code];
    if (!row) return undefined;
    const district = data.districts.find((d) => d.id === row.d);
    if (!district) return undefined;

    return {
      district,
      taluk: undefined,
      lat: row.lat ?? district.lat,
      lng: row.lng ?? district.lng,
      office: row.o,
    };
  },
  taluksOf: (districtId) => data.districts.find((d) => d.id === districtId)?.taluks ?? [],
  searchDistricts: (q) => {
    const query = q.trim().toLowerCase();
    if (!query) return data.districts;
    return data.districts.filter((d) => {
      if (d.name.toLowerCase().includes(query)) return true;
      if ((d.synonyms ?? []).some((s) => s.toLowerCase().includes(query))) return true;
      return false;
    });
  },
}));

/** Convenience: a "place" record — the data we store in profiles/jobs. */
export interface PlaceRef {
  districtId?: string;
  talukId?: string;
  lat?: number;
  lng?: number;
  street?: string; // hidden from public display
  pincode?: string;
}

/** Public display label for a place — never shows the street. */
export function publicLabel(p: PlaceRef | undefined): string {
  if (!p?.talukId) return "—";
  const found = useLocations.getState().talukById(p.talukId);
  if (!found) return "—";
  return `${found.taluk.name} · ${found.district.name}`;
}

export function isPlaceSet(p: PlaceRef | undefined): boolean {
  return !!(p?.districtId && p?.talukId);
}
