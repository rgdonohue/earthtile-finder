# STAC Scene Finder – PRD (v0)
Goal: Find and preview satellite scenes quickly via Earth Search STAC.

Users: scientists, analysts, devs needing fast scene triage.

Success:
- <2s TTI on broadband; search completes <3s for bbox ~2×2 deg.
- First 50 results with footprints + thumbnails.
- URL encodes filters (bbox, datetime, cloud).

Out of scope (v0): pagination UI, titiler overlays, auth, export.
