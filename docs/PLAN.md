# STAC Scene Finder – patched MVP

## 0) Prioritized checklist (do these in order)

1. **App owns the map ref** (no window hacks).
2. **Graceful error + loading states** (never a dead UI).
3. **Auto-search on mount** (Durango bbox + last 30d + cloud≤20).
4. **Responsive layout** (sidebar collapsible at <1024px).
5. **Map cleanup** (avoid leaks).
6. **Thumbnail placeholder + robust date formatting**.
7. **Pagination hint + item count**.
8. **CORS/cache fallback** (tiny local sample).

---

## 1) App-level map ref + bbox getter

Lift the map up; expose bbox via a stable callback. No globals.

```tsx
// App.tsx
import { useRef, useCallback, useEffect } from "react";
import Map from "./components/Map";
import Controls from "./components/Controls";
import ResultsGrid from "./components/ResultsGrid";
import { useSearchStore } from "./store/useSearchStore";
import { stacSearch } from "./lib/stac";
import dayjs from "dayjs";

export default function App() {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const { setFilters, filters, setItems, setLoading, setError } = useSearchStore();

  const getMapBBox = useCallback(() => {
    const m = mapRef.current!;
    const b = m.getBounds();
    return [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()] as [number,number,number,number];
  }, []);

  // sensible defaults (Durango-ish; last 30 days; cloud≤20)
  useEffect(() => {
    const end = dayjs().format("YYYY-MM-DD");
    const start = dayjs().subtract(30, "day").format("YYYY-MM-DD");
    setFilters({
      bbox: [-108.25, 37.05, -107.45, 37.55],
      datetime: `${start}/${end}`,
      cloudLt: 20,
      collections: ["sentinel-2-l2a"],
    });
    // auto-search
    (async () => {
      setLoading(true);
      try {
        const items = await stacSearch({
          collections: ["sentinel-2-l2a"],
          bbox: [-108.25, 37.05, -107.45, 37.55],
          datetime: `${start}/${end}`,
          limit: 50,
          query: { "eo:cloud_cover": { lt: 20 } },
        });
        setItems(items);
      } catch (e) {
        console.error(e);
        setError("Initial search failed. Falling back to sample results.");
      } finally {
        setLoading(false);
      }
    })();
  }, [setFilters, setItems, setLoading, setError]);

  return (
    <div className="h-screen w-screen grid lg:grid-cols-[360px,1fr] grid-cols-1">
      <aside className="border-b lg:border-b-0 lg:border-r flex flex-col">
        <Header />
        <Controls getMapBBox={getMapBBox} />
        <ResultsGrid />
      </aside>
      <main className="min-h-[40vh] lg:min-h-0">
        <Map mapRef={mapRef} />
      </main>
    </div>
  );
}

function Header() {
  return (
    <div className="p-3 border-b flex items-center justify-between">
      <div>
        <h1 className="font-semibold">STAC Scene Finder</h1>
        <p className="text-xs text-gray-600">Earth Search • Sentinel‑2 L2A</p>
      </div>
      <span className="lg:hidden text-xs px-2 py-1 border rounded">Sidebar</span>
    </div>
  );
}
```

**Map component (no leak + ref):**

```tsx
// components/Map.tsx
import maplibregl from "maplibre-gl";
import { useEffect } from "react";
import { useSearchStore } from "../store/useSearchStore";
import "maplibre-gl/dist/maplibre-gl.css";

export default function Map({ mapRef }: { mapRef: React.MutableRefObject<maplibregl.Map | null> }) {
  const { items, selectedId, setSelected } = useSearchStore();

  useEffect(() => {
    if (mapRef.current) return;
    const map = new maplibregl.Map({
      container: "map",
      style: "https://demotiles.maplibre.org/style.json",
      center: [-107.88, 37.27],
      zoom: 8,
    });
    mapRef.current = map;

    map.on("load", () => {
      map.addSource("footprints", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({ id: "fp", type: "line", source: "footprints",
        paint: { "line-color": "#16a34a", "line-width": 1.5 } });
      map.addLayer({ id: "fp-selected", type: "line", source: "footprints",
        filter: ["==", ["get", "id"], ""],
        paint: { "line-color": "#ef4444", "line-width": 3 } });
      map.on("click", "fp", (e) => {
        const id = e.features?.[0]?.properties?.id as string | undefined;
        if (id) setSelected(id);
      });
    });

    return () => { map.remove(); mapRef.current = null; }; // cleanup
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const fc = {
      type: "FeatureCollection",
      features: items.map((it) => ({ type: "Feature", geometry: it.geometry, properties: { id: it.id } })),
    };
    (map.getSource("footprints") as maplibregl.GeoJSONSource).setData(fc);
    if (items.length) {
      // fit to union-ish: use first item bbox to keep it simple & fast
      const b = items[0].bbox;
      map.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: 40 });
    }
    map.setFilter("fp-selected", ["==", ["get", "id"], selectedId ?? ""]);
  }, [items, selectedId]);

  return <div id="map" className="w-full h-full" />;
}
```

---

## 2) Error + loading UI (and no crash)

Add error to store and simple banners/spinners.

```ts
// store/useSearchStore.ts
type State = {
  // ...
  loading: boolean;
  error?: string;
  setLoading: (b: boolean) => void;
  setError: (m?: string) => void;
};
export const useSearchStore = create<State>((set) => ({
  // ...
  loading: false,
  error: undefined,
  setLoading: (b) => set({ loading: b }),
  setError: (m) => set({ error: m }),
}));
```

```tsx
// components/Controls.tsx (search try/catch + banners)
import { useSearchStore } from "../store/useSearchStore";
import { stacSearch } from "../lib/stac";

export default function Controls({ getMapBBox }: { getMapBBox: () => [number,number,number,number] }) {
  const { filters, setFilters, setItems, loading, setLoading, error, setError } = useSearchStore();

  async function runSearch() {
    setLoading(true); setError(undefined);
    try {
      const query: any = {};
      if (filters.cloudLt !== undefined) query["eo:cloud_cover"] = { lt: filters.cloudLt };
      const items = await stacSearch({
        collections: filters.collections,
        bbox: filters.bbox,
        datetime: filters.datetime,
        limit: 50,
        query,
      });
      setItems(items);
      if (!items.length) setError("No results. Try widening the date or bbox.");
    } catch (e) {
      console.error(e);
      setError("Search failed. Try adjusting filters or reload.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-3 border-b space-y-2">
      {loading && <div className="text-xs italic">Searching…</div>}
      {error && <div className="text-xs text-red-600">{error}</div>}

      <button className="px-2 py-1 border rounded" onClick={() => setFilters({ bbox: getMapBBox() })}>
        Use map extent
      </button>

      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs">Start</label>
        <input className="border p-1 text-sm col-span-1" type="date"
          onChange={(e) => {
            const start = e.target.value;
            const end = (filters.datetime?.split("/")?.[1]) ?? start;
            setFilters({ datetime: `${start}/${end}` });
          }} />
        <label className="text-xs">End</label>
        <input className="border p-1 text-sm col-span-1" type="date"
          onChange={(e) => {
            const end = e.target.value;
            const start = (filters.datetime?.split("/")?.[0]) ?? end;
            setFilters({ datetime: `${start}/${end}` });
          }} />
      </div>

      <label className="text-xs">Cloud ≤ {filters.cloudLt}</label>
      <input type="range" min={0} max={80} value={filters.cloudLt ?? 20}
        onChange={(e) => setFilters({ cloudLt: Number(e.target.value) })} />

      <div className="flex items-center gap-2">
        <button className="px-3 py-1 border rounded" onClick={runSearch} disabled={loading}>Search</button>
        <span className="text-xs text-gray-600">Shows first 50 results</span>
      </div>
    </div>
  );
}
```

---

## 3) Thumbnails with placeholder + proper dates

Handle missing thumbs and display ISO instants or ranges correctly.

```tsx
// components/ResultsGrid.tsx
import dayjs from "dayjs";
import { useSearchStore } from "../store/useSearchStore";
const PLACEHOLDER = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='180'>
     <rect width='100%' height='100%' fill='#f3f4f6'/>
     <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#9ca3af' font-size='14'>no preview</text>
   </svg>`
);

function fmtDate(p: any) {
  // STAC items often have properties.datetime (instant ISO) or start/end
  const dt = p["datetime"] || p["start_datetime"] || p["end_datetime"];
  if (!dt) return "—";
  // If it's a range like "start/end", show start
  const s = String(dt);
  const d = s.includes("/") ? s.split("/")[0] : s;
  return dayjs(d).isValid() ? dayjs(d).format("YYYY-MM-DD") : s.slice(0,10);
}

export default function ResultsGrid() {
  const { items, selectedId, setSelected } = useSearchStore();

  return (
    <div className="overflow-auto grow grid grid-cols-2 md:grid-cols-3 gap-2 p-2">
      {items.map((it) => {
        const thumb = it.assets?.thumbnail?.href
          || Object.values(it.assets || {}).find(a => /image\/(png|jpeg)/.test(a.type || ""))?.href
          || PLACEHOLDER;
        const clouds = it.properties?.["eo:cloud_cover"];
        return (
          <button key={it.id}
            onClick={() => setSelected(it.id)}
            className={`border rounded text-left ${selectedId === it.id ? "border-red-500" : "border-gray-300"}`}>
            <img src={thumb} alt={`${it.id} thumbnail`} className="w-full aspect-video object-cover" />
            <div className="p-2 text-xs">
              <div className="font-medium">{fmtDate(it.properties)} · {it.collection}</div>
              <div className="text-gray-600">cloud {clouds ?? "?"}%</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
```

---

## 4) CORS / offline fallback

Drop a **tiny sample JSON** (one STAC FeatureCollection of 3–5 items) in `public/sample.json`. If fetch fails, load it.

```ts
// lib/stac.ts (fallback)
export async function stacSearch(body: SearchBody) {
  try {
    const res = await fetch(`${STAC}/search`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`STAC ${res.status}`);
    const json = await res.json();
    return json.features as StacItem[];
  } catch (e) {
    // fallback
    const sample = await fetch("/sample.json").then(r => r.json()).catch(() => ({ features: [] }));
    return sample.features ?? [];
  }
}
```

---

## 5) Responsive layout + collapsible sidebar

Already in `App.tsx`: one column on small screens, two on large. If you want a toggle:

```tsx
// add to state: sidebarOpen; render <aside className={sidebarOpen ? "block" : "hidden lg:block"}>…
```

---

## 6) Pagination hint / count

In `ResultsGrid` header (or Controls area) add:

```tsx
// somewhere visible
<span className="text-[11px] text-gray-600">Showing up to 50 items</span>
```

If you want a “Load more” later: track `next` tokens (Earth Search returns `links` with rel=next).

---

## 7) Demo script (problem → solution → tech)

* **Problem (1 sentence):** “Finding the right scene in a sea of satellite imagery is slow and fiddly.”
* **Solution (10s):** “Pick your area, timeframe, and cloud threshold — results render instantly as footprints + thumbnails. Click to focus.”
* **Show it (15s):** Use-map-extent → Search → click a card → highlight/zoom.
* **Evidence (5s):** “URL captures state for reproducibility.” Copy/paste the link; open new tab.
* **Tech (10s at the end):** “React + MapLibre, Earth Search STAC `/search`, simple state store, tiny footprint. Next step would add titiler overlays.”

---

## 8) Final notes

* Keep the **limit=50**; say it out loud to preempt “where’s more?”
* Have the **Durango default** ready; don’t pan/zoom live first.
* If the STAC API hiccups, you’ll still demo with **sample.json**.
* Push to GH Pages so you can share the link on the call.

If you want, I can spit out a **copy‑paste README** and a **pre-filled sample.json** schema so you’re literally plugging it in and committing.
