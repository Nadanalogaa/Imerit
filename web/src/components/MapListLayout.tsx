import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import { LayoutGrid, List as ListIcon, Map as MapIcon, MapPin } from "lucide-react";

export type MarkerTone = "brand" | "sky" | "emerald" | "anchor";

export interface MapListItem {
  id: string;
  lat?: number;
  lng?: number;
  /** What to render inside the right-side list. */
  listElement: React.ReactNode;
  /** What to render inside the marker popup. Optional. */
  popupElement?: React.ReactNode;
}

interface Props {
  items: MapListItem[];
  /** Optional reference pin (e.g. candidate's home, employer's office). */
  anchor?: { lat: number; lng: number; label?: string } | null;
  /** Optional radius circle around the anchor (km). */
  radiusKm?: number | null;
  markerTone?: MarkerTone;
  /** Fallback center if no items have coords (default: Tamil Nadu center). */
  defaultCenter?: { lat: number; lng: number };
  defaultZoom?: number;
  /** Element to show when items.length === 0. */
  emptyState?: React.ReactNode;
  /** Optional initial view mode. */
  initialView?: ViewMode;
}

type ViewMode = "list" | "map" | "split";

const TN_CENTER = { lat: 11.1271, lng: 78.6569 };

function makeIcon(tone: MarkerTone, active: boolean, label?: string) {
  return L.divIcon({
    className: "",
    iconSize: [32, 40],
    iconAnchor: [16, 38],
    popupAnchor: [0, -32],
    html: `<div class="itr-marker itr-marker-${tone} ${active ? "itr-marker-active" : ""}">
        <div class="itr-marker-pin">
          ${
            label
              ? `<span style="color:white;font-weight:800;font-size:11px;">${label}</span>`
              : `<span style="color:white;font-weight:800;font-size:14px;">●</span>`
          }
        </div>
      </div>`,
  });
}

/** Pans/zooms the map to fit all markers + anchor whenever they change. */
function FitBounds({
  items,
  anchor,
  active,
}: {
  items: MapListItem[];
  anchor?: Props["anchor"];
  active: string | null;
}) {
  const map = useMap();
  useEffect(() => {
    if (active) {
      const it = items.find((x) => x.id === active);
      if (it && it.lat != null && it.lng != null) {
        map.flyTo([it.lat, it.lng], Math.max(map.getZoom(), 12), { duration: 0.6 });
        return;
      }
    }
    const points: L.LatLngTuple[] = items
      .filter((x) => x.lat != null && x.lng != null)
      .map((x) => [x.lat!, x.lng!]);
    if (anchor) points.push([anchor.lat, anchor.lng]);
    if (points.length === 0) return;
    if (points.length === 1) {
      map.flyTo(points[0], 11, { duration: 0.6 });
    } else {
      map.flyToBounds(L.latLngBounds(points), { padding: [40, 40], duration: 0.6, maxZoom: 12 });
    }
  }, [items, anchor, active, map]);
  return null;
}

export function MapListLayout({
  items,
  anchor,
  radiusKm,
  markerTone = "brand",
  defaultCenter = TN_CENTER,
  defaultZoom = 7,
  emptyState,
  initialView,
}: Props) {
  // Default: split on md+, list on small. We pick on mount.
  const [view, setView] = useState<ViewMode>(() => {
    if (initialView) return initialView;
    if (typeof window === "undefined") return "list";
    return window.matchMedia("(min-width: 1024px)").matches ? "split" : "list";
  });
  const [active, setActive] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // When user clicks a marker, scroll the matching list card into view.
  useEffect(() => {
    if (!active) return;
    const node = listRef.current?.querySelector<HTMLElement>(`[data-mlist-id="${active}"]`);
    node?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [active]);

  const withCoords = useMemo(
    () => items.filter((x) => x.lat != null && x.lng != null),
    [items]
  );

  // Empty case: still show the toggle, but list panel renders empty state.
  const hasItems = items.length > 0;

  return (
    <div className="flex flex-col">
      {/* View toggle */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {hasItems ? (
            <>
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">{items.length}</span>{" "}
              result{items.length === 1 ? "" : "s"}
              {withCoords.length < items.length && (
                <span className="ml-2 text-amber-600 dark:text-amber-400">
                  · {items.length - withCoords.length} without map location
                </span>
              )}
            </>
          ) : null}
        </p>
        <div className="flex items-center gap-1 rounded-full border border-zinc-200 bg-white p-0.5 dark:border-zinc-700 dark:bg-zinc-900">
          {(["list", "split", "map"] as ViewMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setView(m)}
              title={m === "list" ? "List view" : m === "map" ? "Map view" : "Split view"}
              className={[
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition",
                view === m
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200",
              ].join(" ")}
            >
              {m === "list" && <ListIcon size={12} />}
              {m === "split" && <LayoutGrid size={12} />}
              {m === "map" && <MapIcon size={12} />}
              <span className="hidden sm:inline capitalize">{m}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Layout */}
      <div
        className={[
          "gap-4",
          view === "split" ? "grid grid-cols-1 lg:grid-cols-[1fr_1.1fr]" : "block",
        ].join(" ")}
      >
        {/* LIST */}
        {(view === "list" || view === "split") && (
          <div
            ref={listRef}
            className={[
              "min-w-0",
              view === "split" ? "max-h-[70vh] overflow-y-auto pr-1" : "",
            ].join(" ")}
          >
            {!hasItems ? (
              emptyState ?? <DefaultEmpty />
            ) : (
              <div
                className={[
                  "grid gap-3",
                  view === "split" ? "grid-cols-1" : "md:grid-cols-2",
                ].join(" ")}
              >
                {items.map((it) => (
                  <div
                    key={it.id}
                    data-mlist-id={it.id}
                    onMouseEnter={() => setActive(it.id)}
                    onMouseLeave={() => setActive((cur) => (cur === it.id ? null : cur))}
                    className={[
                      "transition",
                      active === it.id ? "ring-2 ring-brand-400 rounded-3xl" : "",
                    ].join(" ")}
                  >
                    {it.listElement}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MAP */}
        {(view === "map" || view === "split") && (
          <div
            className={[
              "relative overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900",
              view === "split" ? "h-[70vh] sticky top-4" : "h-[70vh]",
            ].join(" ")}
          >
            <MapContainer
              center={[
                anchor?.lat ?? withCoords[0]?.lat ?? defaultCenter.lat,
                anchor?.lng ?? withCoords[0]?.lng ?? defaultCenter.lng,
              ]}
              zoom={defaultZoom}
              scrollWheelZoom
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitBounds items={withCoords} anchor={anchor ?? undefined} active={active} />

              {anchor && (
                <>
                  <Marker
                    position={[anchor.lat, anchor.lng]}
                    icon={makeIcon("anchor", false)}
                  >
                    {anchor.label && (
                      <Popup>
                        <div className="px-3 py-2 text-xs font-semibold">{anchor.label}</div>
                      </Popup>
                    )}
                  </Marker>
                  {radiusKm && radiusKm > 0 && radiusKm < 5000 && (
                    <Circle
                      center={[anchor.lat, anchor.lng]}
                      radius={radiusKm * 1000}
                      pathOptions={{
                        color: "#6366f1",
                        fillColor: "#6366f1",
                        fillOpacity: 0.08,
                        weight: 1.5,
                        dashArray: "4 4",
                      }}
                    />
                  )}
                </>
              )}

              {withCoords.map((it) => (
                <Marker
                  key={it.id}
                  position={[it.lat!, it.lng!]}
                  icon={makeIcon(markerTone, active === it.id)}
                  eventHandlers={{
                    click: () => setActive(it.id),
                    mouseover: () => setActive(it.id),
                  }}
                >
                  {it.popupElement && (
                    <Popup>
                      <div className="overflow-hidden rounded-2xl bg-white dark:bg-zinc-900">
                        {it.popupElement}
                      </div>
                    </Popup>
                  )}
                </Marker>
              ))}
            </MapContainer>

            {withCoords.length === 0 && hasItems && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-zinc-50/80 backdrop-blur-sm dark:bg-zinc-950/80">
                <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-center shadow-md dark:border-zinc-700 dark:bg-zinc-900">
                  <MapPin size={20} className="mx-auto text-zinc-400" />
                  <p className="mt-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    No results have map locations yet
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                    Switch to List view to see them.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DefaultEmpty() {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900">
      <MapPin size={32} className="text-zinc-400" />
      <p className="mt-3 text-sm font-semibold">No results</p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        Try widening your filters.
      </p>
    </div>
  );
}
