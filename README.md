# Vegas Control

A map-first operations demo for a Las Vegas party bus and shuttle company, inspired by the supplied MOIA dashboard reference. Built with React, TypeScript, Vite, MapLibre GL JS, and Lucide.

## Run

```sh
npm ci
npm run dev -- --host 127.0.0.1
```

Open http://127.0.0.1:5173. Open this project folder in Cursor to continue development.

```sh
npm run build   # TypeScript and optimized static bundle
npm run lint
npm test       # Playwright; uses installed Google Chrome
npm run preview
```

## Included

- Full-screen vector map of Las Vegas with real camera pitch/rotation, 2D/3D toggle, extruded buildings at closer zoom, isometric vehicle markers, and a service boundary.
- Fleet search and status filters, vehicle capacity and fuel details.
- Play/pause and scrub controls for a 15-minute example shuttle shift. Fleet summary counts are derived from fixtures; shuttle timings recalculate from recorded demo events.
- Dispatch manifest: create, validate passenger capacity, detect exact-time conflicts, start/complete trips, persist in local browser storage, export CSV.
- **Shuttling:** airport ↔ Venetian and optional airport ↔ Virgin Hotels. Manager station switching, inbound arrivals, passenger controls, outbound/return averages, full-cycle averages, loading-delay review, travel-overrun review, and stale-GPS handling.
- Manual departure/arrival events advance the demo shuttle lifecycle; completed cycles update route averages. No ETA is shown for a stale vehicle.
- Responsive driver preview with explicit demo tracking state, manual end shift, and automatic eight-hour expiry. No actual device location is collected.
- Integration information and maintenance acknowledgment; no provider connection is implied.
- Desktop/mobile layouts and browser workflow tests.

## Scope and limitations

This is a deployable **demo frontend**, not a production dispatch or tracking service. Do not put real passenger information in it. There is no authentication, server, shared database, actual dispatch delivery, routing engine, live traffic, payment processing, camera feed, or production mobile tracker. Driver shifts, shuttle counts, and alert acknowledgments are session-only; demo trips persist on the current browser. Fleet/analytics fixtures remain independent of dispatch changes. New reservations allow only vehicles seeded as available and detect same-time collisions, not overlapping journeys. The manifest models one example evening rather than a multi-day scheduling system.

Vector tiles and map fonts are loaded from OpenFreeMap (OpenMapTiles / OpenStreetMap); UI fonts are loaded from Google. The 3D renderer requires WebGL2. The first load needs internet. Use a contracted tile service with suitable usage rights and operational limits for production. Keep required attribution. The app never collects real phone GPS. Closing the demo resets the local shift state.

## Organization

- `src/App.tsx` — workspace and demo workflows
- `src/components/Operations.tsx` — map workspace, shuttling management, timeline, and vehicle inspector
- `src/components/Operations.css` — map-first visual system and phone layouts
- `src/components/FleetMap.tsx` — MapLibre lifecycle, vector layers, markers, and camera controls
- `src/lib/map/style.ts` — custom dark vector cartography
- `src/lib/map/routes.json` — cached example road geometry (OSRM / OpenStreetMap)
- `src/lib/shuttling.ts` — route history, directional averages, cycle timing, progress, and review rules
- `src/lib/data.ts` — typed fictional fixtures and local storage helper
- `src/App.css` — shared shell, forms, dispatch, driver and integration layouts
- `tests/operations.spec.ts`, `tests/shuttling.spec.ts` — browser workflows, timing calculations, stale telemetry, and cycle completion
- `docs/production-plan.md` — architecture, integration findings, and launch gates
- `docs/desktop-preview.png`, `docs/shuttling-preview.png`, `docs/mobile-preview.png` — browser screenshots
- `scripts/capture.mjs` — repeatable screenshot capture (`PREVIEW_URL` can target the production preview)

## Shuttling timing definitions

Outbound is airport departure → hotel arrival. Return is hotel departure → airport arrival. A round trip is airport departure → return airport arrival, including hotel turnaround but excluding loading before departure. Averages only include recorded relevant arrivals. Defaults flag travel more than 5 minutes above the route average and stop dwell above 10 minutes; these are editable demo thresholds, not driver performance judgments. GPS samples older than 2 minutes are stale; their positions freeze and ETA is unavailable.

Trip durations, ETAs, drivers, and vehicle positions are fictional. Cached road geometry is illustrative, not approved airport staging or bus navigation. Current demo return legs retrace the outbound geometry; live routing must account for one-way roads, terminals, bus access, and actual pickup zones. Shuttle state resets when leaving the map workspace or refreshing. Replay is not an event-sourced history: after manual trip events, rewind requires resetting the example shift.

## Demo deployment

Run `npm run build` and serve `dist/` on any static HTTPS host. This does not enable live operations. No deployment was performed or account connected. Provider credentials must never be added to Vite client environment variables.
