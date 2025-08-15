# Architecture
FE: Vite + React + TS, MapLibre, Zustand, Day.js.
No BE in v0.

Data flow:
Controls → build STAC /search body → fetch → normalize → store
→ Map (footprints) + ResultsGrid (thumbnails).

State:
- filters {bbox, datetime, cloudLt, collections}
- items [StacItem]
- selectedId, loading, error

Perf guardrails:
- Memoized FeatureCollection
- Limit=50
- Minimal re-renders (Zustand selectors)
