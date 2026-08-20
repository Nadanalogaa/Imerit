import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import type { Marker as LMarker } from "leaflet";
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
 /**
  * When true, this row spans every grid column and does NOT render the
  * "show on map" button. Used for group separators / dividers that break
  * "best matches" from "other results" in the list.
  */
 fullWidth?: boolean;
}

interface Props {
 items: MapListItem[];
 /** Optional reference pin (e.g. candidate's home, employer's office). */
 anchor?: { lat: number; lng: number; label?: string } | null;
 /** Optional radius circle around the anchor (km). */
 radiusKm?: number | null;
 /** Optional footer rendered with the results column, e.g. pagination. */
 footer?: React.ReactNode;
 /** Changes here reset the internal list scroll to the top. */
 scrollKey?: string | number;
 markerTone?: MarkerTone;
 /**
  * Number of columns to use in the list view when the layout is not split.
  * Split view always renders a single list column so the cards stay readable
  * beside the map.
  */
 listColumns?: 1 | 2;
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

/**
 * Pans/zooms the map to fit all markers + anchor whenever the input list
 * changes. The "selected" item (driven by a deliberate click — never hover)
 * gets a fly + zoom so the user sees their pick framed at street level.
 */
function FitBounds({
 items,
 anchor,
 selected,
}: {
 items: MapListItem[];
 anchor?: Props["anchor"];
 selected: string | null;
}) {
 const map = useMap();
 useEffect(() => {
 if (selected) {
 const it = items.find((x) => x.id === selected);
 if (it && it.lat != null && it.lng != null) {
 map.flyTo([it.lat, it.lng], 14, { duration: 0.6 });
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
 }, [items, anchor, selected, map]);
 return null;
}

export function MapListLayout({
 items,
 anchor,
 radiusKm,
 footer,
 scrollKey,
 markerTone = "brand",
 listColumns = 2,
 defaultCenter = TN_CENTER,
 defaultZoom = 7,
 emptyState,
 initialView,
}: Props) {
 // Default: split on xl+ only. At <1280px the list column gets pinched
 // by the surrounding sidebar (EmployerCandidates has a 280px filter
 // panel) which was making cards render awkwardly narrow. Users can
 // still switch to split from the toolbar.
 const [view, setView] = useState<ViewMode>(() => {
 if (initialView) return initialView;
 if (typeof window === "undefined") return "list";
 return window.matchMedia("(min-width: 1280px)").matches ? "split" : "list";
 });
 /**
 * `hovered` = visual cross-link only (marker/card highlight). Drives no
 * map movement, no list scroll — so casually swiping the cursor across
 * the list doesn't make the map jerk around.
 * `selected` = deliberate click target. Triggers a fly + zoom, opens the
 * popup, and scrolls the list to the matching card.
 */
 const [hovered, setHovered] = useState<string | null>(null);
 const [selected, setSelected] = useState<string | null>(null);
 const highlight = selected ?? hovered;
 const listRef = useRef<HTMLDivElement>(null);
 const markerRefs = useRef<Record<string, LMarker>>({});
 const lastScrollKey = useRef<string | number | undefined>(scrollKey);

 // Map-marker click → scroll the matching list card into view. Hover never
 // triggers scroll — selected is the only signal here.
 useEffect(() => {
 if (!selected) return;
 const node = listRef.current?.querySelector<HTMLElement>(`[data-mlist-id="${selected}"]`);
 node?.scrollIntoView({ behavior: "smooth", block: "center" });
 markerRefs.current[selected]?.openPopup();
 }, [selected]);

 // Page changes move the visible result window back to the top so the
 // next chunk starts at a predictable position in both list and split view.
 useEffect(() => {
 if (scrollKey == null || lastScrollKey.current === scrollKey) return;
 lastScrollKey.current = scrollKey;
 listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
 }, [scrollKey]);

 // Clear `selected` if the user clicks the map background (any non-marker tile)
 // so the popup closes naturally and the next click starts fresh.
 const clearSelected = () => setSelected(null);

 const withCoords = useMemo(
 () => items.filter((x) => x.lat != null && x.lng != null),
 [items]
 );
 // Real content rows (dividers/separators don't count as "results").
 const contentCount = useMemo(
 () => items.filter((x) => !x.fullWidth).length,
 [items]
 );

 // Empty case: still show the toggle, but list panel renders empty state.
 const hasItems = contentCount > 0;

 return (
 <div className="flex flex-col">
 {/* View toggle */}
 <div className="mb-3 flex items-center justify-between gap-3">
 <p className="text-xs text-zinc-500 dark:text-zinc-400">
 {hasItems ? (
 <>
 <span className="font-semibold text-zinc-700 dark:text-zinc-300">{contentCount}</span>{" "}
 result{contentCount === 1 ? "" : "s"}
 {withCoords.length < contentCount && (
 <span className="ml-2 text-amber-600 dark:text-amber-400">
 · {contentCount - withCoords.length} without map location
 </span>
 )}
 </>
 ) : null}
 </p>
 <div className="flex items-center gap-1 rounded-full bg-white p-0.5 dark:border-zinc-700 dark:bg-zinc-900">
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
     // Bump the split breakpoint to xl and give the list slightly more
     // room than the map (1.2fr vs 1fr) so cards read comfortably even at
     // the borderline width. Below xl we render list-only.
     view === "split" ? "grid grid-cols-1 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] xl:items-start" : "block",
     ].join(" ")}
 >
 {/* LIST — in split view the list column gets its own internal
     scroll and matches the map's fixed viewport height, so the
     document itself never grows. Filters stay fully visible on
     the left, map stays visible on the right, and only the list
     scrolls inside its own column. Below xl (mobile / tablet)
     the list falls back to natural document flow. */}
 {(view === "list" || view === "split") && (
 <div
 ref={listRef}
 className={[
 "min-w-0",
 view === "split"
   ? "xl:sticky xl:top-24 xl:h-[calc(100vh-12rem)] xl:overflow-y-auto xl:pr-2"
   : "",
 ].join(" ")}
 >
 {!hasItems ? (
 emptyState ?? <DefaultEmpty />
 ) : (
 <div
 className={[
 // Split view + explicit listColumns=1 use flex-col — bulletproof
 // single-column stacking that nothing external can accidentally
 // multiply. Only the "list" view with listColumns=2 opts into
 // the responsive 2-col grid.
 view === "split" || listColumns === 1
   ? "flex flex-col gap-3"
   : "grid gap-3 grid-cols-1 md:grid-cols-2",
 ].join(" ")}
 >
 {items.map((it) => (
 <div
 key={it.id}
 data-mlist-id={it.id}
 onMouseEnter={() => setHovered(it.id)}
 onMouseLeave={() => setHovered((cur) => (cur === it.id ? null : cur))}
 className={[
 // w-full so cards fill their row in the flex container.
 // md:col-span-2 only matters when the parent is a 2-col
 // grid (list mode + listColumns=2).
 "relative w-full transition rounded-3xl",
 highlight === it.id ? "ring-2 ring-brand-400" : "",
 it.fullWidth ? "md:col-span-2" : "",
 ].join(" ")}
 >
 {it.listElement}
 {!it.fullWidth && view === "split" && it.lat != null && it.lng != null && (
 <button
 type="button"
 onClick={(e) => {
 e.preventDefault();
 e.stopPropagation();
 setSelected(it.id);
 }}
 title="Show on map"
 className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-zinc-500 shadow-sm ring-1 ring-zinc-200 transition hover:bg-brand-50 hover:text-brand-700 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-700 dark:hover:bg-brand-500/10"
 >
 <MapIcon size={13} />
 </button>
 )}
 </div>
 ))}
 </div>
 )}
 {footer}
 </div>
 )}

 {/* MAP */}
{(view === "map" || view === "split") && (
 <div
 className={[
 "relative overflow-hidden rounded-3xl bg-zinc-100 dark:bg-zinc-900 min-h-[22rem]",
 view === "split" ? "xl:sticky xl:top-24 xl:h-[calc(100vh-12rem)] xl:self-start" : "h-[70vh]",
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
 <FitBounds items={withCoords} anchor={anchor ?? undefined} selected={selected} />
 <MapBackgroundClick onClick={clearSelected} />

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
 icon={makeIcon(markerTone, highlight === it.id)}
 ref={(m) => {
 if (m) markerRefs.current[it.id] = m;
 else delete markerRefs.current[it.id];
 }}
 eventHandlers={{
 click: () => setSelected(it.id),
 mouseover: () => setHovered(it.id),
 mouseout: () => setHovered((cur) => (cur === it.id ? null : cur)),
 popupclose: () => setSelected((cur) => (cur === it.id ? null : cur)),
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
 <div className="rounded-2xl bg-white px-5 py-4 text-center shadow-md dark:border-zinc-700 dark:bg-zinc-900">
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
 {footer && view === "map" && footer}
  </div>
  )}
 </div>
 </div>
 );
}

/**
 * Listens for clicks on the bare map (no marker hit) and clears the
 * selection. Keeps state clean when the user wants to deselect by clicking
 * elsewhere — same behavior as Google Maps / Mapbox.
 */
function MapBackgroundClick({ onClick }: { onClick: () => void }) {
 const map = useMap();
 useEffect(() => {
 map.on("click", onClick);
 return () => {
 map.off("click", onClick);
 };
 }, [map, onClick]);
 return null;
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
