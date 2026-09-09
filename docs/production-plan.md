# Vegas Control: path to live operations

Research checked September 9, 2026. This document describes planned production capabilities, not implemented services.

## What the screenshot likely shows

The reference names Felix Zwick, MOIA Mobility Consulting, and a “Waymo in Munich” scenario. This strongly points to MOIA's **Mobility Impact Analyzer (MIA)**. MOIA describes its Explorer, Simulator, and Presenter modules for modeling service areas and comparing fleet scenarios. The screenshot alone cannot establish the exact version, but it is consistent with its Presenter interface. It is not evidence of an internal Waymo application.

- Product and access: https://www.moia.io/en/solutions/mobility-consulting/mia
- Application: https://mia.vwgroup.cloud/
- Explanation of the modules: https://www.moia.io/en/blog/mobility-impact-analyzer

Vegas Control preserves the visual concept—dark geographic canvas, vehicle status colors, compact statistics, time playback—while replacing the simulation workflow with party bus operations. It is an independent application and uses no MOIA code or branding.

## Integrations

### Verizon Connect Reveal

The described road-facing and driver-facing cameras are consistent with Reveal Integrated Video. Confirm the actual product and account before implementation. Verizon advertises a telematics API toolkit and a Reveal developer portal. GPS/vehicle data and event integration are plausible, but footage availability, retention, permissions, endpoint contracts, and whether video is an event clip rather than a continuous stream need validation. Do not promise a live dual-camera stream.

- API program: https://www.verizonconnect.com/services/api-integration/
- Integration help: https://reveal-help.verizonconnect.com/hc/en-us/sections/5491620930451-API-integrations
- Dual-view description: https://www.verizonconnect.com/resources/article/benefits-driver-facing-dashcams/

Ask the account administrator for product name, developer access, authorized vehicle identifiers, scopes, API quotas, webhook capabilities, sample payloads, and permitted camera-event access. Keep credentials server-side. Display the measured age of each GPS sample; never animate stale real telemetry to look live.

### Moovs

Moovs lists a **Custom API** in its pricing comparison. This establishes an advertised capability, not a public endpoint contract or eligibility for this company's plan. Obtain documentation and written account-access confirmation. Moovs is distinct from the similarly named Moov payments API.

- Official pricing and features: https://www.moovsapp.com/pricing

Start with read-only booking import. Reconcile provider IDs, timezone, canceled trips, changed passenger counts, driver assignments, and duplicate events. Before bidirectional updates, define which system owns each field and how conflicts are resolved. If API access is unavailable, add a validated CSV import with preview, explicit column mapping, row-level errors, and deduplication. The current demo has CSV export only.

## Proposed architecture

- React dispatcher workspace; hosted behind an identity provider with MFA and organization isolation.
- API service and PostgreSQL for vehicles, drivers, assignments, shifts, reservations, routes, stops, telemetry, incidents, integration cursors, and audit events.
- Roles: owner/admin, dispatcher, driver, read-only manager. Camera review is a separate least-privilege permission.
- Server-to-server integration workers with encrypted secrets, verified incoming events where supported, idempotency, retries, dead-letter queues, and synchronization health.
- Realtime channel for fleet events; periodic reconciliation with authoritative storage.
- Native iOS/Android driver app for background tracking, permission handling, offline delivery, shift timers, battery behavior, and version management.
- Map provider agreement and directions service for road-based routes, traffic estimates, restrictions, and accurate ETAs.

No live data pipeline should rely on localStorage or browser timers.

## Driver tracking contract

Driver chooses Start shift and receives a clear tracking notice. Server creates a shift with a hard `ends_at` and issues a short-lived, shift-scoped credential bound to that driver and device. A location submission includes shift ID, monotonically ordered sample ID, capture timestamp, coordinates, and accuracy. Server checks both ingestion time and capture time against the authorized shift, device association, and token validity. Reject off-shift samples; invalidate credentials immediately on manual end or expiry. End tracking locally at expiry even offline. On resume, check server state before any further collection. Discard queued off-shift samples. Log consent, start, stop, and access without logging secrets.

A supervisor may extend a shift only through an audited action communicated to the driver. Tracking and login are separate: ending tracking must not prevent access to payslips or next-day schedules. An optional automatic account logout can accompany expiry, but server enforcement must hold even if a device is suspended or its clock changes. A browser/PWA preview is not evidence of reliable locked-screen tracking.

Test device lock, OS suspension, denied/revoked permission, approximate location, low-power mode, lost network, clock skew, app termination, expired tokens, supervisor revocation, and shifts crossing midnight. Route all operational dates through America/Los_Angeles; store instants in UTC.

## Required operational behavior

- Scheduling: full date/time windows, duration and buffers, overlapping assignment prevention, vehicle capacity, accessibility requirements, offline vehicles, driver availability, shift limits, changes and cancellation history.
- Dispatch: acknowledge assignment, en route, arrived, boarding, in service, completed, no-show, canceled; timestamp every transition. Notify real drivers only after authorized delivery integration.
- Shuttle: named routes, actual road geometry, stop pickup windows, headways, occupancy per vehicle, board/alight counts, missed stops, accessible boarding, service suspension, and rider-facing stop ETAs.
- Safety: timestamped stale-location warnings, incident triage, restricted video access, inspection/maintenance holds, escalation contacts. Do not imply emergency services integration.
- Reliability: provider outage indicator, last-successful-sync time, retries, replay protection, human-readable error recovery, backups, monitored latency, restore exercises.
- Data: retention and deletion policy, staff access review, audit history, account offboarding, export controls. Confirm operational/legal policies with the company before real tracking.

## Launch sequence

1. Confirm company identity, actual fleet roster, dispatch process, branding, Moovs plan, and Verizon product. Review this demo with dispatchers and drivers.
2. Implement authentication, tenant isolation, database, authorization, audit events, and server-side validation. Verify cross-role and cross-organization access denials.
3. Import real bookings read-only into a staging environment; reconcile against Moovs with representative changes and cancellations.
4. Connect a small set of consented test vehicles; measure sample age, accuracy, event deduplication, and provider outage handling.
5. Build native driver tracking and pilot on actual devices, including locked-screen and off-shift rejection tests.
6. Run a supervised shadow shift alongside the current dispatch system. Resolve discrepancies before making this operationally authoritative.
7. Deploy behind authentication with monitoring, backups, incident ownership, rollback procedure, training, and provider support contacts.

Acceptance requires shared data persistence, tested authorization, credible telemetry freshness, correct assignment conflict detection, no off-shift location acceptance, restore verification, and no critical failures in a supervised shift.

## September 9 refinement: airport shuttling

The demo now uses MapLibre GL JS with a custom vector style from OpenFreeMap, tilted/rotatable 3D camera, extruded buildings, and airport/hotel hubs. MapLibre v6 needs an explicit Vite-bundled worker URL; the implementation uses `?worker&url` so the production worker includes its dependencies. See https://maplibre.org/maplibre-gl-js/docs/ and https://openfreemap.org/quick_start/.

Shuttling models LAS ↔ The Venetian and LAS ↔ Virgin Hotels. Manager location is independent of route analytics: airport inbound includes both hotel routes, while directional averages and review counts are scoped to the selected route. Outbound, return, hotel dwell, and full-cycle durations have separate definitions in the README. Averages update on completed demo events. Stale GPS does not generate an ETA or simulated movement. Travel and stop thresholds are configurable; review flags do not infer fault.

Cached geometry was obtained from the public OSRM demo routing service on September 9, 2026, from example coordinates near the airport and hotels, using OpenStreetMap road data. It is for visual demonstration only. Return travel currently reverses the same geometry, which is not a valid production route on one-way roads. The live service needs independently routed directions, verified terminal and hotel bus bays, geofences, and arrival/departure detection with dwell debouncing. Collect actual trip samples before using the averages as operational baselines. Keep historical measurements separate by route, direction, terminal, time of day, and service date.

Before a live pilot, validate GPS age using server-observed sample timestamps, reconcile manual events with geofence events, deduplicate arrivals, and allow audited corrections. Partial cycles must not enter full-cycle averages. Expose sample counts and avoid performance conclusions from a tiny or unrepresentative sample. Phone background tracking remains unimplemented; the responsive web UI is usable on a phone, but it is not a native tracker.
