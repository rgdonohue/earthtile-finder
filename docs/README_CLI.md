# README\_CLI.md — Running CODEX CLI for *EarthTile Finder*

This doc tells **CODEX CLI** (and you) exactly how to build, run, and extend the project **without drowning the agent in context**. It pairs with the auto‑generated **`AGENTS.md`** created after `/init`.

> TL;DR: Keep prompts small, reference only the docs a step needs, and validate output with acceptance checks.

---

## 1) Project Snapshot

* **Goal:** Small React + MapLibre app that searches **Earth Search STAC** (`/search`) and previews results (footprints + thumbnails).
* **No backend** in v0.
* **Key constraints:** Limit=50, never crash, defaults load data (Durango bbox, last 30 days, cloud ≤20).

---

## 2) Repo Structure (agent‑aware)

```
/docs
  PRD.md               # product goals & scope
  ARCHITECTURE.md      # FE only; state shape & data flow
  API_CONTRACTS.md     # STAC /search body/response
  UI_SPEC.md           # controls, interactions, a11y
  TEST_PLAN.md         # unit/integration checks
  PERF_BUDGET.md       # bundle/TTI budgets
  ACCESSIBILITY.md     # keyboard, aria-live
  ERROR_TAXONOMY.md    # error messages & codes
  CACHING_STRATEGY.md  # fallback, sample.json
  DEMO_SCRIPT.md       # 30–60s demo talk track
  PROMPTS_CODEX.md     # task list & acceptance criteria
/env/.env.example
/public/sample.json    # offline fallback results
/public/screenshot.png
/src/...               # app code
README.md
README_CLI.md          # this file
AGENTS.md              # auto-generated after /init
```

**Rule for agents:** Only load the docs referenced in the current step. Never “read the whole repo.”

---

## 3) First‑Run Commands

```bash
# 1) Initialize agent workspace & generate AGENTS.md
/init

# 2) Install & start (dev loop)
npm install
npm run dev
```

`/init` should detect this file and **AGENTS.md** will outline available tools, run profiles, and guardrails. If the CLI supports “plans” or “goals,” point it to `/docs/PROMPTS_CODEX.md`.

---

## 4) Minimal Task Plan (for agents)

**Step 1 — Scaffold + Deps**
Inputs: `/docs/ARCHITECTURE.md`, `/docs/PRD.md`
Output: Vite React TS app; install `maplibre-gl`, `zustand`, `dayjs`.

**Step 2 — State Store**
Inputs: `/docs/ARCHITECTURE.md` (state shape), `/docs/UI_SPEC.md`
Output: `src/store/useSearchStore.ts` with `{filters, items, selectedId, loading, error}`.

**Step 3 — STAC Client**
Inputs: `/docs/API_CONTRACTS.md`, `/docs/ERROR_TAXONOMY.md`, `/docs/CACHING_STRATEGY.md`
Output: `src/lib/stac.ts` with POST `/search`, normalization, **fallback to `/public/sample.json`** on network error.

**Step 4 — Map Component**
Inputs: `/docs/ARCHITECTURE.md`, `/docs/UI_SPEC.md`
Output: `src/components/Map.tsx` with footprints + selected highlight; **cleanup on unmount**.

**Step 5 — Controls + Results Grid**
Inputs: `/docs/UI_SPEC.md`, `/docs/ACCESSIBILITY.md`
Output: `Controls.tsx`, `ResultsGrid.tsx`; loading & error banners; placeholder thumbnail.

**Step 6 — URL State + Defaults**
Inputs: `/docs/PRD.md`
Output: auto‑search on mount with Durango/last‑30‑days/cloud≤20; URL params encode filters.

**Step 7 — Validation**
Inputs: `/docs/TEST_PLAN.md`, `/docs/PERF_BUDGET.md`
Output: Passing unit/integration checks; bundle under budget.

---

## 5) Prompt Template (short & strict)

Use this **exact structure** for CODEX CLI prompts:

```
SYSTEM
You are building a small React + MapLibre app (no backend). Follow the constraints in the provided docs. Do not read files not explicitly listed.

USER
Task: <one concrete step>
Files to consult:
- /docs/<DOC1>.md
- /docs/<DOC2>.md

Acceptance criteria:
- <bulleted checks copied from PROMPTS_CODEX.md or TEST_PLAN.md>

Allowed edits:
- /src/**, /public/**, vite.config.ts, package.json

Disallowed:
- Creating servers, adding heavy libs, reading entire repo.

Return:
- Changed file diffs
- Commands I should run
- A 2‑line rationale
```

Keep each task **single‑purpose** (e.g., “implement stac.ts fetch & normalization”).

---

## 6) Run Profiles

* **Build:** `npm run build`
* **Dev:** `npm run dev`
* **Preview:** `npm run preview`
* **Deploy (optional):** `npm run deploy` (GitHub Pages)

Agents: after each code change, run **dev** and try one search. Report failures with the **Error Taxonomy** messaging.

---

## 7) Guardrails for the Agent

* **Context hygiene:** Never include `/docs` wholesale. Cite only the specific doc(s) for the current step.
* **No over‑engineering:** No Redux, no router, no design system, no backend.
* **Perf budget:** See `/docs/PERF_BUDGET.md` — enforce bundle ≤ **300 KB gz**.
* **Resilience:** All fetch errors → friendly banner; UI stays interactive.
* **Accessibility:** Keyboard focus on controls & cards; `aria-live="polite"` for loading/errors.
* **Cleanup:** Map instance must `.remove()` on unmount.

---

## 8) Acceptance Checklist (v0 “green light”)

* App loads with **defaults** and shows ≥1 item in Durango.
* “Use map extent” updates `bbox`; **Search** returns items or **E02\_EMPTY** hint.
* Selecting a card **highlights** footprint & fits bounds.
* Refresh with same URL → same state.
* Bundle ≤ 300 KB gz; TTI ≤ 2s local; no console errors.

---

## 9) Troubleshooting

* **No results:** Expand dates, raise cloud limit, or zoom out.
* **CORS/network:** Fallback should kick in (`/public/sample.json`). If not, check `stac.ts` catch block.
* **Map not updating:** Ensure GeoJSON source ID matches layer; confirm store subscriptions.
* **Large bundle:** Remove unused imports; prefer vanilla React + Zustand; avoid map plugins.

---

## 10) Handover Notes

* Next steps live in `/docs/ROADMAP.md`.
* For new tasks, update `/docs/PROMPTS_CODEX.md` so agents have **one source of truth** for acceptance criteria.
* Keep `AGENTS.md` (auto‑generated) committed if your workflow expects it; otherwise add to `.gitignore`.

---

### One‑liner for agents

> “For each step, read only the 1–3 docs referenced, apply changes to `/src/**`, validate against **TEST\_PLAN** & **PERF\_BUDGET**, and keep the app resilient (never crash).”

---

## React + Tailwind “no‑footguns” playbook

### 1) Golden rules for the agent

* **Single source of truth:** Only consult `/docs/ARCHITECTURE.md`, `/docs/UI_SPEC.md`, and this checklist while wiring styles. Do **not** invent extra tooling (no Redux, no CSS frameworks beyond Tailwind).
* **Minimal Tailwind:** Use utility classes for layout/spacing/typography only. No plugins (forms/typography) in v0.
* **Zero global overrides:** Don’t reset `box-sizing`, don’t touch MapLibre CSS except importing it.
* **Small, testable steps:**

  1. Install + configure Tailwind
  2. Verify utilities render in `App.tsx`
  3. Then style `Controls`, `ResultsGrid`, `Map`

### 2) Tailwind setup that actually works with Vite + TS (copy/paste)

**Install**

```bash
npm i -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**`tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html","./src/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
```

**`src/index.css`** (or `src/styles.css`—just be consistent)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* MapLibre needs its own CSS */
@import "maplibre-gl/dist/maplibre-gl.css";

/* Optional: a very light layer for borders and focus rings */
:root { --ring: 2px solid rgba(59,130,246,.6); }
*:focus-visible { outline: var(--ring); outline-offset: 2px; }
```

**`src/main.tsx`**

```ts
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";           // <- DO NOT FORGET THIS
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
```

**Smoke test in `App.tsx`**

```tsx
export default function App() {
  return (
    <div className="h-screen w-screen grid lg:grid-cols-[360px,1fr] grid-cols-1">
      <aside className="border-b lg:border-b-0 lg:border-r p-3">
        <h1 className="font-semibold">STAC Scene Finder</h1>
        <p className="text-xs text-gray-600">Earth Search • Sentinel‑2 L2A</p>
        <button className="mt-2 px-2 py-1 border rounded">Button</button>
      </aside>
      <main className="min-h-[40vh] lg:min-h-0">Map goes here</main>
    </div>
  );
}
```

**Acceptance checks (agent must verify):**

* Running `npm run dev` shows a left sidebar with a bordered button and a right blank panel.
* Tailwind classes (e.g., `border-b`, `text-xs`, `grid-cols-1`) render correctly.
* No CSS errors in console. MapLibre CSS is loaded (will show once the map mounts).

### 3) LLM failure modes to guard against (and the fix)

1. **Forgets to include Tailwind directives** → Check `index.css` has `@tailwind base; components; utilities;`.
2. **Wrong content globs** → Must be `./index.html` and `./src/**/*.{ts,tsx}` or purge will strip your classes.
3. **Forgets to import CSS** → Ensure `import "./index.css"` is in `main.tsx` (not `App.tsx`).
4. **Breaks MapLibre UI** by overriding globals → Never override `.maplibregl-ctrl*` styles; if z-index issues, style your panels, not the map CSS.
5. **Adds Tailwind plugins** that bloat bundle → Skip in v0; perf budget matters.
6. **Mixes class libraries** (shadcn/ui, DaisyUI, etc.) → Don’t. Utilities only.
7. **JIT purge removes dynamic classes** → Avoid string‑built classnames; prefer explicit utilities (e.g., don’t do `` `border-${color}` ``).

### 4) Styling conventions (keep the agent deterministic)

* **Layout:** grid with two columns on `lg`, single column on mobile:

  * Root: `grid lg:grid-cols-[360px,1fr] grid-cols-1 h-screen w-screen`
* **Panels:** `border`, `p-3`, `space-y-2`
* **Buttons:** `px-2 py-1 border rounded hover:bg-gray-50 active:bg-gray-100`
* **Inputs:** `border p-1 text-sm rounded`
* **Labels/help:** `text-xs text-gray-600`
* **Cards:** `border rounded overflow-hidden focus-visible:outline`
* **Scroll:** `overflow-auto` on the grid container (results list)

### 5) Map + Tailwind coexistence

* Map container uses `id="map"` and Tailwind sizing:

  * Wrapper: `className="w-full h-full"`
* If controls overlay the map later, use a **panel with pointer-events** unaffected:

  * Panel: `absolute top-2 left-2 z-10`
* Don’t set a global `z-index: 9999;`; just set `z-10` / `z-20` locally.

### 6) Quick a11y recipe (so the agent won’t guess)

* Add focus rings (already in CSS above).
* Loading/error banners:

  * Wrapper: `role="status" aria-live="polite"` with `text-xs`.
* Selectable cards:

  * `<button aria-pressed={selectedId===it.id} ...>`

### 7) Performance guardrails (Tailwind + Vite)

* No plugin bloat; no runtime CSS-in-JS.
* Keep components small; memoize the FeatureCollection in Map.
* Confirm prod bundle ≤ **300 KB gz** after `npm run build`.

### 8) A tiny “Task” for CODEX CLI (copy into your `/init` prompt)

```
Task: Wire Tailwind CSS into the existing Vite React TS app without plugins.

Use only these docs:
- /docs/ARCHITECTURE.md (layout expectations)
- /docs/UI_SPEC.md (component surfaces)

Acceptance:
- index.css includes Tailwind directives and MapLibre import.
- tailwind.config.js content globs = ["./index.html","./src/**/*.{ts,tsx}"].
- main.tsx imports "./index.css".
- App renders two-column layout on lg and one-column on mobile with visible borders.
- No global CSS overrides that affect MapLibre controls.

Return:
- File diffs
- Commands to run
- 2-line rationale
```

