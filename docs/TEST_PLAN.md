# Test Plan
Unit:
- stac.ts: builds body; parses features
- urlState.ts: enc/dec filters

Integration:
- "Use map extent" sets bbox in store
- "Search" → loading true → items>0 or graceful error
- Selecting card updates selectedId + map filter

Smoke (CI):
- Build size < 300KB gzipped
- Lighthouse PWA perf >= 90 (dev server ok)
