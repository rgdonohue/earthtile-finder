# Repository Guidelines

## Project Structure & Module Organization
- `src/`: React + TypeScript app code (components, store, lib).
  - `src/components/` (PascalCase components), `src/lib/` (STAC client, utils), `src/store/` (Zustand state).
- `public/`: static assets and `sample.json` (offline fallback).
- `docs/`: specs and plans (start with `ARCHITECTURE.md`, `API_CONTRACTS.md`, `TEST_PLAN.md`).
- `env/.env.example`: copy to `.env.local` for local config.

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: start Vite dev server with HMR.
- `npm run build`: production bundle.
- `npm run preview`: serve the built app locally.
- `npm run deploy` (optional): publish `dist/` (e.g., GitHub Pages) after `vite.config.ts` `base` is set.

## Coding Style & Naming Conventions
- **Language:** TypeScript, React function components, hooks-first.
- **Indentation:** 2 spaces; semicolons; single quotes.
- **Components:** PascalCase files in `src/components/` (e.g., `ResultsGrid.tsx`).
- **Hooks/Stores:** `useX.ts` in `src/store/` (e.g., `useSearchStore.ts`).
- **Utilities:** kebab-case in `src/lib/` (e.g., `stac-client.ts`).
- **Styling:** Tailwind utility classes when present; otherwise minimal CSS modules.
- Prefer small, pure functions; keep side effects in hooks and the store.

## Testing Guidelines
- See `docs/TEST_PLAN.md` for scenarios and acceptance checks.
- Target: state transitions, STAC client behavior (network error → `public/sample.json` fallback), URL sync.
- Naming: colocate `*.test.ts(x)` next to source or under `src/__tests__/`.
- If configured, run `npm test` (Vitest/RTL). Keep tests deterministic and fast.

## Commit & Pull Request Guidelines
- Use Conventional Commits (e.g., `feat: add bbox control`, `fix: fallback on 5xx`).
- Scope PRs narrowly; include:
  - Clear description and rationale; link issues.
  - Screenshots/GIFs for UI changes (map, grid, errors).
  - Test notes: what you verified locally; any new tests.
  - Docs updates when API, state, or UX changes (`docs/*.md`).

## Security & Configuration Tips
- Do not commit real secrets; use `.env.local` (gitignored).
- STAC endpoint defaults to Earth Search; keep `limit=50` unless justified.
- Validate user inputs (dates, bbox) and handle network errors with user-friendly messages from `docs/ERROR_TAXONOMY.md`.

