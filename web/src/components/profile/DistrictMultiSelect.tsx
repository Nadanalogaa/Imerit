import { useState } from "react";
import { ChevronDown, Check, X } from "lucide-react";
import { useLocations } from "../../store/locations";

interface Props {
  value: string[]; // district IDs
  onChange: (next: string[]) => void;
  max?: number;
}

/**
 * Multi-select chips + searchable dropdown of every Tamil Nadu district.
 * Selected districts render as removable chips above the dropdown trigger.
 * Use for the "Preferred work" picker — candidates can pick several districts
 * they're open to working in without the noise of taluk + pincode.
 */
export function DistrictMultiSelect({ value, onChange, max = 10 }: Props) {
  const districts = useLocations((s) => s.districts);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = districts.filter((d) => value.includes(d.id));
  const filtered = districts
    .filter((d) => !value.includes(d.id))
    .filter((d) => d.name.toLowerCase().includes(query.toLowerCase().trim()));

  const toggle = (id: string) => {
    if (value.includes(id)) onChange(value.filter((v) => v !== id));
    else if (value.length < max) onChange([...value, id]);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((d) => (
            <span
              key={d.id}
              className="inline-flex items-center gap-1 rounded-md bg-brand-100 px-2 py-1 text-[12px] font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
            >
              {d.name}
              <button
                type="button"
                onClick={() => toggle(d.id)}
                className="text-brand-600 transition hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-200"
                aria-label={`Remove ${d.name}`}
              >
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex h-11 w-full items-center justify-between rounded-lg border border-zinc-300 bg-white px-3.5 text-left text-sm transition hover:border-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/15 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-zinc-600"
        >
          <span className={selected.length ? "text-zinc-700 dark:text-zinc-300" : "text-zinc-400"}>
            {selected.length
              ? `${selected.length} district${selected.length === 1 ? "" : "s"} selected · click to ${open ? "close" : "add more"}`
              : "Select districts you're open to work in"}
          </span>
          <ChevronDown size={15} className={`text-zinc-400 transition ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute z-30 mt-1 max-h-72 w-full overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <div className="border-b border-zinc-200 p-2 dark:border-zinc-700">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search districts…"
                autoFocus
                className="h-9 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/15 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:bg-zinc-950"
              />
            </div>
            <ul className="max-h-56 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-[12px] text-zinc-500">No districts match "{query}"</li>
              ) : (
                filtered.map((d) => (
                  <li key={d.id}>
                    <button
                      type="button"
                      onClick={() => {
                        toggle(d.id);
                        setQuery("");
                      }}
                      disabled={value.length >= max}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-brand-500/10"
                    >
                      <span className="text-zinc-700 dark:text-zinc-300">{d.name}</span>
                      <Check size={12} className="invisible text-brand-500 group-hover:visible" />
                    </button>
                  </li>
                ))
              )}
            </ul>
            {value.length >= max && (
              <div className="border-t border-zinc-200 px-3 py-2 text-[11px] text-amber-700 dark:border-zinc-700 dark:text-amber-400">
                Maximum of {max} districts reached. Remove one to add another.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
