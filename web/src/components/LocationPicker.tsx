import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Search, Pin, CheckCircle2, AlertCircle } from "lucide-react";
import { useLocations, type PlaceRef } from "../store/locations";

interface Props {
  value: PlaceRef;
  onChange: (next: PlaceRef) => void;
  /** Show "Street / landmark" optional field. Defaults to true. */
  allowStreet?: boolean;
  /** Show "Pincode autofill" field. Defaults to true. */
  allowPincode?: boolean;
  /** Label for the entire picker. */
  label?: string;
}

export function LocationPicker({
  value,
  onChange,
  allowStreet = true,
  allowPincode = true,
  label,
}: Props) {
  const districts = useLocations((s) => s.districts);
  const taluksOf = useLocations((s) => s.taluksOf);
  const talukById = useLocations((s) => s.talukById);
  const resolvePincode = useLocations((s) => s.resolvePincode);

  const [pincode, setPincode] = useState(value.pincode ?? "");

  const currentDistrict = value.districtId
    ? districts.find((d) => d.id === value.districtId)
    : undefined;
  const taluks = value.districtId ? taluksOf(value.districtId) : [];
  const currentTaluk = value.talukId
    ? talukById(value.talukId)?.taluk
    : undefined;

  // Resolution state for the pincode field — drives the inline status hint.
  // "miss" means the pincode is 6 digits but absent from the full TN dataset.
  // "district_only" means the dataset recognised it but we don't know the
  // exact taluk, so the user still needs to pick from the dropdown.
  const resolution = useMemo(() => {
    if (pincode.length !== 6) return null;
    return resolvePincode(pincode) ?? null;
  }, [pincode, resolvePincode]);

  // Apply pincode → auto-fill district (+ taluk if known) + lat/lng
  useEffect(() => {
    if (!pincode || pincode.length !== 6) return;
    if (pincode === value.pincode) return;
    const r = resolvePincode(pincode);
    if (r) {
      onChange({
        ...value,
        districtId: r.district.id,
        // If the full dataset only knew the district, clear any stale taluk
        // so the dropdown highlights as needing input.
        talukId: r.taluk?.id,
        lat: r.lat,
        lng: r.lng,
        pincode,
      });
    } else {
      onChange({ ...value, pincode });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pincode]);

  const setDistrict = (districtId: string) => {
    const d = districts.find((x) => x.id === districtId);
    if (!d) return;
    // Reset taluk on district change
    onChange({
      ...value,
      districtId,
      talukId: undefined,
      lat: d.lat,
      lng: d.lng,
    });
  };

  const setTaluk = (talukId: string) => {
    const found = talukById(talukId);
    if (!found) return;
    onChange({
      ...value,
      districtId: found.district.id,
      talukId,
      lat: found.taluk.lat,
      lng: found.taluk.lng,
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {label && (
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          <MapPin size={14} className="text-rose-500" />
          {label}
        </div>
      )}

      {allowPincode && (
        <div>
          <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            Pincode (auto-fills district + taluk)
          </label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="e.g. 600001"
              inputMode="numeric"
              className="w-full rounded-2xl border border-zinc-200 bg-white py-2.5 pl-9 pr-3 text-sm placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-800 dark:bg-zinc-950"
            />
          </div>

          <AnimatePresence>
            {pincode.length === 6 && resolution && (
              <motion.p
                initial={{ opacity: 0, y: -3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-1.5 flex items-start gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400"
              >
                <CheckCircle2 size={12} className="mt-0.5 shrink-0" />
                <span>
                  <span className="font-semibold">{resolution.district.name}</span>
                  {resolution.office && <span className="text-emerald-600/80 dark:text-emerald-400/80"> · {resolution.office}</span>}
                  {!resolution.taluk && (
                    <span className="text-amber-700 dark:text-amber-400"> — pick your taluk below</span>
                  )}
                </span>
              </motion.p>
            )}
            {pincode.length === 6 && !resolution && (
              <motion.p
                initial={{ opacity: 0, y: -3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-1.5 flex items-start gap-1.5 text-[11px] text-amber-700 dark:text-amber-400"
              >
                <AlertCircle size={12} className="mt-0.5 shrink-0" />
                <span>Pincode not in our directory. Pick district + taluk manually below.</span>
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            District
          </label>
          <select
            value={value.districtId ?? ""}
            onChange={(e) => setDistrict(e.target.value)}
            className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <option value="">Select district</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            Taluk
          </label>
          <select
            value={value.talukId ?? ""}
            onChange={(e) => setTaluk(e.target.value)}
            disabled={!value.districtId}
            className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <option value="">
              {value.districtId ? `Select taluk (${taluks.length} options)` : "Pick a district first"}
            </option>
            {taluks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {allowStreet && (
        <div>
          <label className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
            Street / landmark <span className="text-zinc-400">(optional · kept private)</span>
          </label>
          <div className="relative">
            <Pin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={value.street ?? ""}
              onChange={(e) => onChange({ ...value, street: e.target.value })}
              placeholder="e.g. Near Egmore Museum, Pantheon Road"
              className="w-full rounded-2xl border border-zinc-200 bg-white py-2.5 pl-9 pr-3 text-sm placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-zinc-800 dark:bg-zinc-950"
            />
          </div>
          <p className="mt-1 text-[10.5px] text-zinc-500 dark:text-zinc-400">
            Public job/profile cards only show District + Taluk. Street is private.
          </p>
        </div>
      )}

      <AnimatePresence>
        {currentDistrict && currentTaluk && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
          >
            <MapPin size={13} />
            <span className="font-semibold">{currentTaluk.name}, {currentDistrict.name}</span>
            <span className="text-emerald-600/70 dark:text-emerald-400/70">
              · {currentTaluk.lat.toFixed(3)}, {currentTaluk.lng.toFixed(3)}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
