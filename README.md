# EarthTile Finder

A lightweight, React + MapLibre web app to search and preview satellite scenes from a public **STAC API** (Earth Search). Built as a quick prototype to showcase performant geospatial UI, clean API integration, and reproducible search state.

![screenshot-placeholder](public/screenshot.png)

## ✨ Features

* **BBox Search** — Use the current map extent to set the query area.
* **Date Range Filter** — Pick start/end dates.
* **Cloud Cover Filter** — Slider to limit scenes by `eo:cloud_cover`.
* **Interactive Map** — Footprints drawn in MapLibre; click to highlight.
* **Thumbnail Grid** — Scene thumbnails with collection, date, cloud info.
* **Shareable State** — Filters encoded in URL for reproducibility.
* **Durango Default** — Loads last 30 days of Sentinel-2 L2A over SW Colorado on first visit.
* **Error/Loading States** — Clear feedback when searches run or fail.
* **Offline Fallback** — Local sample results if the STAC API isn’t reachable.

## 🛠 Tech Stack

* [React](https://react.dev/) + [Vite](https://vitejs.dev/) + TypeScript
* [MapLibre GL JS](https://maplibre.org/) for map rendering
* [Zustand](https://github.com/pmndrs/zustand) for minimal state management
* [Day.js](https://day.js.org/) for date handling
* Tailwind CSS (optional) for quick, responsive layout

## 📦 Install & Run

```bash
# clone
git clone https://github.com/YOURNAME/earthtile-finder
cd earthtile-finder

# install deps
npm install

# start dev server
npm run dev
```

## 🚀 Deploy to GitHub Pages

1. In `vite.config.ts`, set:

   ```ts
   export default defineConfig({
     base: '/earthtile-finder/'
   });
   ```
2. Add a deploy script:

   ```json
   "scripts": {
     "deploy": "gh-pages -d dist"
   }
   ```
3. Build & publish:

   ```bash
   npm run build
   npm run deploy
   ```

## 🔍 How It Works

1. **Controls panel** lets you set filters:

   * `bbox` — automatically grabbed from current map extent.
   * `datetime` — ISO range in `YYYY-MM-DD/YYYY-MM-DD` format.
   * `eo:cloud_cover` — numeric filter.
2. **POST /search** request to [Earth Search v1](https://earth-search.aws.element84.com/v1).
3. Results drawn to:

   * **Footprints layer** in MapLibre.
   * **Grid of cards** with thumbnails and metadata.
4. **Click card** → highlight footprint + center map.
5. **URL params** updated for reproducibility.

## ⚠️ Notes & Limitations

* Limited to **first 50 results** per search (no pagination in MVP).
* Thumbnail availability varies by collection; placeholder shown if missing.
* STAC API latency can vary — loading state shows progress.
* Fallback `public/sample.json` used if API fails (for offline demo safety).

## 💡 Next Steps

* Add pagination and result count.
* Support multiple collections (e.g., Landsat, MODIS).
* Overlay preview imagery using titiler.
* Persist search history in localStorage.

## 🗺 Credits

Prototype by [Richard Donohue, PhD](https://smallbatchmaps.com) — geospatial data scientist & full-stack developer.

Uses open data from [Microsoft Planetary Computer](https://planetarycomputer.microsoft.com/) / Earth Search.
