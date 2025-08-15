# UI Spec
Layout:
- Sidebar: Controls + ResultsGrid
- Main: MapLibre map

Controls:
- Buttons: Use Map Extent, Search
- Inputs: StartDate, EndDate, Cloud slider (0–80)
- Indicators: "Searching…", error banner, "Showing up to 50 results"

Interactions:
- Click card → highlight footprint + fitBounds
- Auto-search on mount with defaults (Durango, last 30d, cloud≤20)

A11y:
- Keyboard focus for cards, aria-pressed on selected, visible focus rings
