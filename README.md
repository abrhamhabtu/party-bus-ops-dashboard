# Vegas Fleet Command

A map-first operations demo for a Las Vegas party bus and shuttle company, styled after the supplied nighttime fleet command reference. Built with React, TypeScript, Vite, MapLibre GL JS, and Lucide.

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

## Try the interactive demo

Use **Demo scenes** above the map to load Daytime fleet, Strip at night, Airport shuttling, or Delayed shuttle review. Movement scenes start replay automatically; delay review pauses on Bankroll so you can inspect its leg time. Select buses, pause or scrub the timeline, switch airport/hotel stations, and reset the example shift to start again. These workflows require no Verizon account and continue to work when the connection service is unavailable. The map still needs internet for its map tiles.

## Included

- Full-screen vector map of Las Vegas with real camera pitch/rotation, 2D/3D toggle, extruded buildings at closer zoom, isometric vehicle markers, and a service boundary.
- Fleet search and status filters, vehicle capacity and fuel details.
- Play/pause and scrub controls for a 15-minute example shuttle shift. The fleet timeline covers a full 24-hour demo schedule. Fleet summary counts are derived from fixtures; shuttle timings recalculate from recorded demo events.
- Dispatch manifest: create, validate passenger capacity, detect exact-time conflicts, start/complete trips, persist in local browser storage, export CSV.
- **Shuttling:** airport ↔ Venetian and optional airport ↔ Virgin Hotels. Manager station switching, inbound arrivals, passenger controls, outbound/return averages, full-cycle averages, loading-delay review, travel-overrun review, and stale-GPS handling.
- Manual departure/arrival events advance the demo shuttle lifecycle; completed cycles update route averages. No ETA is shown for a stale vehicle.
- Responsive driver preview with explicit demo tracking state, manual end shift, and automatic eight-hour expiry. No actual device location is collected.
- Dedicated fleet directory, disconnected road/driver camera views, maintenance acknowledgment, schedule reporting and CSV export.
- Gold Vegas landmark silhouettes, cyan/gold bus markers, activity zones, map layers, and a schedule-derived ride activity chart.
- Server-only Verizon Reveal credential and vehicle-location access checks; credentials never enter the client bundle. Live mapping remains disabled pending account payload validation.
- Desktop/mobile layouts and browser workflow tests.

## Scope and limitations

This is a deployable **demo with a read-only integration setup server**, not a production dispatch or tracking service. Do not put real passenger information in it. There is no production user authentication, shared database, actual dispatch delivery, routing engine, live traffic, payment processing, camera feed, or production mobile tracker. Driver shifts, shuttle counts, and alert acknowledgments are session-only; demo trips persist on the current browser. Fleet/analytics fixtures remain independent of dispatch changes. New reservations allow only vehicles seeded as available and detect same-time collisions, not overlapping journeys. The manifest models one example evening rather than a multi-day scheduling system.

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

The demo can be hosted as a static Vite app (without connection diagnostics). For Netlify, connect the GitHub repo and use the included `netlify.toml` (`npm run build`, publish `dist/`). Locally: `npm run build` and serve `dist/` on any static HTTPS host.

This does not enable live operations. Provider credentials must never be added to Vite client environment variables.


## Verizon Reveal setup

A normal Reveal login alone does not activate this integration. Request API access in **Reveal → Marketplace → API Integrations**, register the application, and obtain the separate REST integration credentials. Camera access is a separate capability and is not implemented here.

1. Copy `.env.example` to `.env` locally. Set `VERIZON_APP_ID`, `VERIZON_REST_USERNAME`, and `VERIZON_REST_PASSWORD` from your authorized integration. Never use `VITE_` variables for secrets.
2. Set `VERIZON_TEST_VEHICLE_NUMBER` to the actual provider vehicle **number**, which may differ from its display name.
3. Set `APP_ACCESS_TOKEN` to a long random operator key. Restart the development server after changing these variables.
4. Open Integrations, enter the operator key, and select **Verify read-only API access**. The key is held in memory and cleared after the check. This checks authentication and, when configured, one vehicle's location endpoint. It does not enable live map data.
5. Before enabling real operations, validate your account response schema, map provider vehicle numbers to this roster, add shared storage and authenticated manager roles, and implement GPS ingestion with freshness/error handling. Driver phone background tracking requires a separate native app implementation.

```sh
npm run test:server # mock provider auth, token caching, redaction, API authorization
npm run build
npm run serve       # Node 22+, UI + API on http://127.0.0.1:4174
```

`npm run dev` also includes the API middleware. `npm run preview` and static hosts do not. The bundled server binds to loopback; a hosted deployment requires a secured HTTPS reverse proxy and proper user authentication before real account data is used. The US Reveal endpoint is fixed server-side. Checks are limited to once every three minutes and token reuse is capped below its documented expiry. No live account was contacted during development; provider behavior was tested with mocks.

Official references: [Request API access](https://reveal-help.verizonconnect.com/hc/en-us/articles/5491815998099-Create-API-and-webhook-integrations), [REST developer quick start](https://fleetmatics.apiportal.akana.com/content/home/support/guides/DeveloperQuickStartGuide.htm?locale=browser), [Vehicle location request](https://fim.eu.fleetmatics.com/content/home/support/samplecode/GET_Vehicle_Location.htm).

The map uses real vector geography with stylized landmark buildings, not satellite photography or surveyed 3D building models. Purple activity markers are demo zones, not a live demand prediction.
