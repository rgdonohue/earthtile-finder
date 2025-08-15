# CODEX CLI Tasking

## Context
We are building a React+MapLibre app to query Earth Search STAC /search and render footprints + thumbnails.

## Constraints
- No backend
- Limit=50
- Defaults: Durango bbox [-108.25, 37.05, -107.45, 37.55], last 30 days, cloud≤20
- Must never hard-crash; show loading + error messages

## High-Level Tasks
1) Scaffold app with Vite React TS; add deps: maplibre-gl, zustand, dayjs.
2) Implement store with filters/items/selected/loading/error.
3) Implement stac.ts: POST /search, normalize items, fallback to /sample.json.
4) Build Map component with footprints + selected highlight; clean up on unmount.
5) Build Controls (use map extent, date range, cloud slider, search).
6) Build ResultsGrid (thumbnails + metadata; placeholder if missing).
7) Implement URL state read/write on search.
8) Add responsive layout + basic a11y.
9) Add npm scripts: dev, build, preview, deploy (gh-pages).
10) Generate README badges + screenshot.

## Acceptance Criteria
- Running `npm run dev` starts app; default load shows ≥1 item list in Durango.
- Changing filters and clicking Search updates results or gives friendly guidance.
- Selecting a card highlights the corresponding footprint.
- Refreshing with the same URL reproduces state.
- Lighthouse perf ≥ 90 local; bundle ≤ 300KB gz.

## Example STAC Body
{
  "collections": ["sentinel-2-l2a"],
  "bbox": [-108.25, 37.05, -107.45, 37.55],
  "datetime": "2025-07-15/2025-08-14",
  "limit": 50,
  "query": {"eo:cloud_cover": {"lt": 20}}
}
