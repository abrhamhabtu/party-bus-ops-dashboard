import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  BusFront,
  Check,
  ChevronDown,
  ChevronUp,
  Compass,
  Fuel,
  Layers3,
  MapPin,
  Minus,
  Pause,
  Play,
  Plus,
  Radio,
  RotateCcw,
  Route,
  Search,
  Settings2,
  Signal,
  TriangleAlert,
  Users,
  Video,
  X,
} from "lucide-react";
import type { MapVehicle } from "./FleetMap";
const FleetMap = lazy(() => import("./FleetMap"));
import { fleet, fleetSnapshot, FLEET_DAY_MINUTES, FLEET_EVENING } from "../lib/data";
import { isNightOps } from "../lib/map/cameras";
import {
  atStation,
  completedRuns,
  coordinateAlong,
  driverRotation,
  inboundTo,
  isAirport,
  phaseLabel,
  progressAt,
  routeStats,
  SESSION_START,
  shuttleBoard,
  shuttleFleet,
  stations,
  terminalHopCoordinate,
  vehicleTiming,
  type CompletedRun,
  type Hotel,
  type ShuttleVehicle,
  type Station,
} from "../lib/shuttling";
const statusColors = {
  "On trip": "#e2c48a",
  Available: "#9ad0c6",
  "To pickup": "#d7b48a",
  Offline: "#657586",
};
const shuttleColor = (v: ShuttleVehicle) =>
  v.freshnessSeconds > 120
    ? "#84909e"
    : v.phase === "outbound"
      ? "#e2c48a"
      : v.phase === "return"
        ? "#9ad0c6"
        : v.phase === "terminal-hop"
          ? "#d7b48a"
          : "#c4b8a4";
const formatTime = (m: number) =>
  `${Math.floor(m / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(m % 60)
    .toString()
    .padStart(2, "0")}`;
function MiniStat({
  label,
  value,
  unit,
  detail,
  warn = false,
}: {
  label: string;
  value: string | number;
  unit?: string;
  detail?: string;
  warn?: boolean;
}) {
  return (
    <div className={"telemetry-stat " + (warn ? "stat-warn" : "")}>
      <span>{label}</span>
      <strong>
        {value}
        <small>{unit}</small>
      </strong>
      {detail && <em>{detail}</em>}
    </div>
  );
}
export default function Operations({
  shuttle,
  onMode,
  onNewTrip,
  onIntegrations,
}: {
  shuttle: boolean;
  onMode: (shuttle: boolean) => void;
  onNewTrip: () => void;
  onIntegrations: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("All"),
    [perspective, setPerspective] = useState(true),
    [showLayers, setShowLayers] = useState(false),
    [showArea, setShowArea] = useState(true),
    [showVehicles, setShowVehicles] = useState(true),
    [showBuildings, setShowBuildings] = useState(true),
    [command, setCommand] = useState({ kind: "", id: 0 }),
    [playing, setPlaying] = useState(false),
    [fleetMinute, setFleetMinute] = useState(FLEET_EVENING),
    [shuttleMinute, setShuttleMinute] = useState(SESSION_START),
    [expanded, setExpanded] = useState(false),
    [hotel, setHotel] = useState<Hotel>("venetian"),
    [station, setStation] = useState<Station>("t1"),
    [shuttles, setShuttles] = useState(shuttleFleet),
    [runs, setRuns] = useState(completedRuns),
    [hasRecordedEvents, setHasRecordedEvents] = useState(false),
    [chartMode, setChartMode] = useState<"legs" | "cycles">("legs"),
    [settings, setSettings] = useState(false),
    [travelBuffer, setTravelBuffer] = useState(5),
    [dwellLimit, setDwellLimit] = useState(10),
    [note, setNote] = useState("");
  const minute = shuttle ? shuttleMinute : fleetMinute;
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      if (shuttle) {
        setShuttleMinute((v) => {
          const next = v + 0.5;
          if (next >= SESSION_START + 15)
            return hasRecordedEvents ? SESSION_START + 15 : SESSION_START;
          return next;
        });
      } else {
        setFleetMinute((v) => {
          const next = v + 8;
          return next >= FLEET_DAY_MINUTES ? 0 : next;
        });
      }
    }, shuttle ? 250 : 180);
    return () => clearInterval(timer);
  }, [playing, shuttle, hasRecordedEvents]);
  useEffect(() => {
    if (!note) return;
    const timer = setTimeout(() => setNote(""), 4500);
    return () => clearTimeout(timer);
  }, [note]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelected(null);
        setShowLayers(false);
        setSettings(false);
      }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, []);
  const stats = routeStats(hotel, runs),
    board = shuttleBoard(hotel, runs),
    routeVehicles = shuttles.filter((v) => v.hotel === hotel);
  const timing = (v: ShuttleVehicle) =>
    vehicleTiming(v, minute, travelBuffer, dwellLimit, runs);
  const reviewVehicles = routeVehicles.filter((v) => timing(v).attention);
  const inbound = shuttles
    .filter((v) => inboundTo(v, station))
    .sort(
      (a, b) =>
        (timing(a).stale ? 999 : (timing(a).eta ?? 999)) -
        (timing(b).stale ? 999 : (timing(b).eta ?? 999)),
    );
  const queued = shuttles.filter((v) => atStation(v, station));
  const activeShuttle = shuttles.find((v) => v.id === selected),
    activeFleet = fleet.find((v) => v.id === selected);
  const fleetLive = fleet.map((v) => ({
    v,
    snap: fleetSnapshot(v, fleetMinute),
  }));
  const activeSnap = fleetLive.find((item) => item.v.id === selected)?.snap;
  const visibleFleet = fleetLive.filter(
    ({ v, snap }) =>
      `${v.name} ${v.id} ${v.driver}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === "All" || snap.status === filter),
  );
  const visibleShuttles = routeVehicles.filter(
    (v) =>
      `${v.id} ${v.name} ${v.driver}`.toLowerCase().includes(query.toLowerCase()) &&
      (filter === "All" ||
        (filter === "Needs review" && !!timing(v).attention) ||
        (filter === "Inbound" && inboundTo(v, station)) ||
        (filter === "At stop" && atStation(v, station))),
  );
  const mapVehicles = useMemo<MapVehicle[]>(
    () =>
      shuttle
        ? shuttles.map((v) => {
            const p = progressAt(v, minute, runs);
            return {
              id: v.id,
              name: v.name,
              driver: v.driver,
              coordinates:
                v.phase === "terminal-hop"
                  ? terminalHopCoordinate(p)
                  : v.phase === "loading" || v.phase === "standby"
                    ? stations[v.terminal].coordinates
                    : coordinateAlong(
                        v.hotel,
                        v.phase === "return" ? 1 - p : p,
                      ),
              color: shuttleColor(v),
              heading: 0,
              stale: v.freshnessSeconds > 120,
            };
          })
        : fleetLive
            .filter(({ snap }) => snap.status !== "Offline")
            .map(({ v, snap }) => ({
              id: v.id,
              name: v.name,
              driver: v.driver,
              coordinates: snap.coordinates,
              color: v.color,
              heading: 0,
            })),
    [shuttle, shuttles, minute, runs, fleetLive],
  );
  const mapCommand = (kind: string) => setCommand({ kind, id: Date.now() });
  function changeMode(next: boolean) {
    setSelected(null);
    setFilter("All");
    setQuery("");
    onMode(next);
  }
  function changeStation(s: Station) {
    setStation(s);
    if (!isAirport(s)) setHotel(s);
    setSelected(null);
    setFilter("All");
  }
  function reset() {
    setFleetMinute(FLEET_EVENING);
    setShuttleMinute(SESSION_START);
    setPlaying(false);
    setShuttles(shuttleFleet);
    setRuns(completedRuns);
    setHasRecordedEvents(false);
    setNote("Example shift restored.");
  }
  function advance(v: ShuttleVehicle) {
    if (timing(v).stale) {
      setNote(
        "GPS is stale. Confirm the vehicle location before changing its stop.",
      );
      return;
    }
    setHasRecordedEvents(true);
    let next: ShuttleVehicle = {
      ...v,
      phaseStarted: minute,
      positionMinute: minute,
    };
    if (v.phase === "loading" || v.phase === "standby")
      next = {
        ...next,
        phase: "outbound",
        cycleStarted: minute,
        hotelArrival: undefined,
        hotelDepart: undefined,
        progress: 0.03,
      };
    if (v.phase === "terminal-hop")
      next = {
        ...next,
        phase: "loading",
        terminal: "t3",
        progress: 0,
      };
    if (v.phase === "outbound")
      next = {
        ...next,
        phase: "hotel-stop",
        hotelArrival: minute,
        progress: 1,
        passengers: 0,
      };
    if (v.phase === "hotel-stop")
      next = { ...next, phase: "return", hotelDepart: minute, progress: 0.03 };
    if (v.phase === "return") {
      if (
        v.cycleStarted !== null &&
        v.hotelArrival !== undefined &&
        v.hotelDepart !== undefined
      ) {
        const run: CompletedRun = {
          id: `${v.id}-${runs.length}`,
          hotel: v.hotel,
          depart: v.cycleStarted,
          hotelArrival: v.hotelArrival,
          hotelDepart: v.hotelDepart,
          airportReturn: minute,
        };
        setRuns([...runs, run]);
      }
      next = {
        ...next,
        phase: "loading",
        cycleStarted: null,
        hotelArrival: undefined,
        hotelDepart: undefined,
        progress: 0,
        passengers: 0,
      };
    }
    setShuttles(shuttles.map((x) => (x.id === v.id ? next : x)));
    setNote(`${v.id} · ${phaseLabel(next)}. Demo event recorded.`);
  }
  const moveLabel = (v: ShuttleVehicle) =>
    ({
      loading: `Depart ${v.terminal === "t3" ? "T3" : "T1"} ground`,
      standby: `Depart ${v.terminal === "t3" ? "T3" : "T1"} ground`,
      outbound: "Mark hotel arrival",
      "hotel-stop": "Start return to airport",
      return: "Complete round trip",
      "terminal-hop": "Arrive T3 ground",
    })[v.phase];
  const chartRuns = runs
    .filter((r) => r.hotel === hotel && r.airportReturn !== null)
    .slice(-8);
  return (
    <main
      className={
        "operations-canvas " + (shuttle ? "shuttle-mode" : "fleet-mode")
      }
    >
      <Suspense
        fallback={<div className="map-loading">Loading 3D map renderer…</div>}
      >
        <FleetMap
          vehicles={mapVehicles}
          selected={selected}
          onSelect={setSelected}
          shuttle={shuttle}
          hotel={hotel}
          showArea={showArea}
          showVehicles={showVehicles}
          showBuildings={showBuildings}
          perspective={perspective}
          minute={fleetMinute}
          command={command}
        />
      </Suspense>
      <div className="map-toolbar">
        <button
          className="region-select"
          onClick={() => mapCommand("reset")}
          title={
            shuttle
              ? "Return to airport loop"
              : isNightOps(fleetMinute)
                ? "Return to Strip and Fremont"
                : "Return to valley frame"
          }
        >
          <MapPin size={15} />
          <span>
            {shuttle ? "Airport loop" : isNightOps(fleetMinute) ? "Night corridor" : "Valley"}
            <small>
              {shuttle
                ? "T1 / T3 · Strip"
                : isNightOps(fleetMinute)
                  ? "Strip · Fremont"
                  : "Day coverage"}
            </small>
          </span>
          <ChevronDown size={13} />
        </button>
        <div className="mode-control">
          <button
            className={!shuttle ? "selected" : ""}
            onClick={() => changeMode(false)}
          >
            <BusFront size={15} />
            <span>Fleet view</span>
          </button>
          <button
            className={shuttle ? "selected" : ""}
            onClick={() => changeMode(true)}
          >
            <ArrowLeftRight size={15} />
            <span>Shuttling</span>
          </button>
        </div>
        <div className="map-toolbar-end">
          <span className="simulation-indicator">
            <i />
            {playing ? "Demo running" : "Demo paused"}
          </span>
          <button
            className="map-tool"
            aria-label="Map layers"
            aria-expanded={showLayers}
            onClick={() => setShowLayers(!showLayers)}
          >
            <Layers3 size={16} />
            <span>Layers</span>
          </button>
        </div>
      </div>
      {showLayers && (
        <div className="map-layer-popover">
          <strong>Map layers</strong>
          {[
            { label: "Service area", value: showArea, set: setShowArea },
            {
              label: "Vehicle locations",
              value: showVehicles,
              set: setShowVehicles,
            },
            {
              label: "3D buildings",
              value: showBuildings,
              set: setShowBuildings,
            },
          ].map((l) => (
            <label key={l.label}>
              <input
                type="checkbox"
                checked={l.value}
                onChange={(e) => l.set(e.target.checked)}
              />
              {l.label}
            </label>
          ))}
          <small>Buildings appear as you zoom in.</small>
        </div>
      )}
      <div className="geographic-title">
        <span>NEVADA / CLARK COUNTY</span>
        <h1>
          {shuttle
            ? "Shuttling"
            : isNightOps(fleetMinute)
              ? "Strip · Fremont"
              : "Las Vegas valley"}
        </h1>
        <p>
          {shuttle
            ? "Airport ground · T1 holding, T3 overflow, Venetian returns"
            : isNightOps(fleetMinute)
              ? "Busy-night frame · hotel hops, downtown and Fremont"
              : "Day coverage · suburbs to the Strip"}
        </p>
      </div>
      {shuttle && (
        <div className="station-switcher">
          <span>MANAGING FROM</span>
          <div>
            {(["t1", "t3", "venetian", "virgin"] as Station[]).map((s) => (
              <button
                key={s}
                className={station === s ? "active" : ""}
                onClick={() => changeStation(s)}
              >
                {s === "t1"
                  ? "T1 ground"
                  : s === "t3"
                    ? "T3 ground"
                    : s === "venetian"
                      ? "Venetian"
                      : "Virgin Hotel"}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="map-legend-compact">
        <span className="legend-title">
          {shuttle ? "SHUTTLE STATUS" : "VEHICLE STATUS"}
        </span>
        {(shuttle
          ? [
              ["#e2c48a", "To hotel"],
              ["#9ad0c6", "To airport"],
              ["#d7b48a", "T1 → T3"],
              ["#c4b8a4", "At stop"],
              ["#84909e", "GPS stale"],
            ]
          : [
              ["#e2c48a", "On trip"],
              ["#9ad0c6", "Available"],
              ["#d7b48a", "To pickup"],
            ]
        ).map(([color, label]) => (
          <span key={label}>
            <i style={{ background: color }} />
            {label}
          </span>
        ))}
        <div className="legend-boundary">
          <i />
          {shuttle
            ? "Airport loop"
            : isNightOps(fleetMinute)
              ? "Night corridor"
              : "Valley boundary"}
        </div>
      </div>
      <div className="map-navigation">
        <button
          className={perspective ? "engaged" : ""}
          aria-label={perspective ? "Switch to 2D map" : "Switch to 3D map"}
          onClick={() => setPerspective(!perspective)}
        >
          {perspective ? "3D" : "2D"}
        </button>
        <button aria-label="Reset map" onClick={() => mapCommand("reset")}>
          <Compass size={18} />
        </button>
        <button aria-label="Zoom in" onClick={() => mapCommand("in")}>
          <Plus size={18} />
        </button>
        <button aria-label="Zoom out" onClick={() => mapCommand("out")}>
          <Minus size={18} />
        </button>
      </div>
      <aside className="telemetry-panel">
        <div className="telemetry-heading">
          <div>
            <span className="micro-label">
              {shuttle ? "ROUTE INTELLIGENCE" : "OPERATIONS"}
            </span>
            <h2>{shuttle ? "Airport transfer" : "Fleet at a glance"}</h2>
          </div>
          <button
            aria-label="Timing settings"
            className={"quiet-button " + (settings ? "engaged" : "")}
            onClick={() => setSettings(!settings)}
          >
            <Settings2 size={16} />
          </button>
        </div>
        {shuttle && (
          <label className="route-select">
            <Route size={15} />
            <select
              aria-label="Shuttle route"
              value={hotel}
              onChange={(e) => {
                const h = e.target.value as Hotel;
                setHotel(h);
                setSelected(null);
                setFilter("All");
                if (!isAirport(station)) setStation(h);
              }}
            >
              <option value="venetian">T1 / T3 ↔ The Venetian</option>
              <option value="virgin">T3 ↔ Virgin Hotels</option>
            </select>
          </label>
        )}
        {settings && (
          <div className="timing-settings">
            <strong>Review thresholds</strong>
            <label>
              Travel over route average{" "}
              <span>
                <input
                  aria-label="Travel delay tolerance"
                  type="number"
                  min={1}
                  max={30}
                  value={travelBuffer}
                  onChange={(e) =>
                    setTravelBuffer(
                      Math.max(1, Math.min(30, Number(e.target.value))),
                    )
                  }
                />{" "}
                min
              </span>
            </label>
            <label>
              Time at loading stop{" "}
              <span>
                <input
                  aria-label="Loading time threshold"
                  type="number"
                  min={1}
                  max={60}
                  value={dwellLimit}
                  onChange={(e) =>
                    setDwellLimit(
                      Math.max(1, Math.min(60, Number(e.target.value))),
                    )
                  }
                />{" "}
                min
              </span>
            </label>
            <p>
              Review flags indicate elapsed time, not fault. GPS older than 2
              min is marked stale.
            </p>
          </div>
        )}
        <div className="telemetry-grid">
          {shuttle ? (
            <>
              <MiniStat
                label="Airport → hotel"
                value={stats.outbound ?? "—"}
                unit="min"
                detail="Avg. completed outbound"
              />
              <MiniStat
                label="Hotel → airport"
                value={stats.return ?? "—"}
                unit="min"
                detail="Avg. completed return"
              />
              <MiniStat
                label="Round trip"
                value={stats.roundTrip ?? "—"}
                unit="min"
                detail="Includes hotel turnaround"
              />
              <MiniStat
                label="Active vehicles"
                value={routeVehicles.length}
                unit="on route"
                detail={`${stats.completed} completed cycles`}
              />
              <MiniStat
                label="At your stop"
                value={queued.length}
                unit="vehicles"
                detail={stations[station].short}
              />
              <MiniStat
                label="Needs review"
                value={reviewVehicles.length}
                unit="vehicles"
                detail="Travel, loading or GPS"
                warn={reviewVehicles.length > 0}
              />
            </>
          ) : (
            <>
              <MiniStat
                label="Fleet size"
                value={fleet.length}
                unit="vehicles"
              />
              <MiniStat
                label="On the road"
                value={fleetLive.filter(({ snap }) => snap.status !== "Offline").length}
                unit="online"
              />
              <MiniStat
                label="Passengers"
                value={fleetLive.reduce((a, { snap }) => a + snap.passengers, 0)}
                unit="on board"
              />
              <MiniStat
                label="Available"
                value={fleetLive.filter(({ snap }) => snap.status === "Available").length}
                unit="vehicles"
              />
              <MiniStat
                label="To pickup"
                value={fleetLive.filter(({ snap }) => snap.status === "To pickup").length}
                unit="vehicles"
              />
              <MiniStat
                label="Maintenance"
                value={fleetLive.filter(({ snap }) => snap.status === "Offline").length}
                unit="offline"
                warn
              />
            </>
          )}
        </div>
        <section className="route-performance">
          {shuttle ? (
            <>
              <div className="section-heading">
                <h3>Trip performance</h3>
                <small>
                  {board.dropOffs} drop-offs · {board.milesDriven} mi
                </small>
              </div>
              <div
                className="rotation-board"
                aria-label="Airport to hotel rotation"
              >
                <div className="rotation-stop">
                  <b>{board.airport}</b>
                  <small>Airport</small>
                </div>
                <div className="rotation-leg">
                  <em>{board.outbound ?? "—"} min</em>
                  <span />
                  <small>{board.oneWayMiles} mi out</small>
                </div>
                <div className="rotation-stop hotel">
                  <b>{board.hotelName}</b>
                  <small>
                    Drop-off · {board.dwell ?? "—"} min turn
                  </small>
                </div>
                <div className="rotation-leg return">
                  <em>{board.return ?? "—"} min</em>
                  <span />
                  <small>{board.oneWayMiles} mi back</small>
                </div>
                <div className="rotation-stop">
                  <b>{board.airport}</b>
                  <small>Airport</small>
                </div>
              </div>
              <div className="rotation-totals">
                <div>
                  <strong>{board.roundTrip ?? "—"}</strong>
                  <span>min cycle</span>
                </div>
                <div>
                  <strong>{board.roundMiles}</strong>
                  <span>mi round</span>
                </div>
                <div>
                  <strong>{board.milesDriven}</strong>
                  <span>Miles tonight</span>
                </div>
                <div>
                  <strong>{board.dropOffs}</strong>
                  <span>Hotel drop-offs</span>
                </div>
                <div>
                  <strong>{board.guests}</strong>
                  <span>guests moved</span>
                </div>
              </div>
              <ul className="driver-rotations">
                {routeVehicles.slice(0, 5).map((v) => {
                  const row = driverRotation(v, minute, runs);
                  const denom = Math.max(1, row.expected ?? 20);
                  const pct = Math.min(100, (row.elapsed / denom) * 100);
                  return (
                    <li key={v.id}>
                      <button
                        className={selected === v.id ? "selected" : ""}
                        aria-label={`${row.driver} · ${row.name}`}
                        onClick={() => setSelected(v.id)}
                      >
                        <span>
                          <strong>{row.driver}</strong>
                          <small>
                            {row.name} · {phaseLabel(v)}
                          </small>
                        </span>
                        <b>
                          {row.elapsed} / {row.expected ?? "—"} min
                          <small>
                            {row.miles} mi
                            {row.guests ? ` · ${row.guests} on board` : ""}
                          </small>
                        </b>
                        <i
                          className={row.attention ? "late" : ""}
                          style={{ width: `${pct}%` }}
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <>
              <div className="section-heading">
                <h3>Shuttle performance</h3>
                <div className="chart-toggle">
                  <button
                    className={chartMode === "legs" ? "active" : ""}
                    onClick={() => setChartMode("legs")}
                  >
                    One way
                  </button>
                  <button
                    className={chartMode === "cycles" ? "active" : ""}
                    onClick={() => setChartMode("cycles")}
                  >
                    Round trip
                  </button>
                </div>
              </div>
              <div
                className="performance-chart"
                aria-label={`${chartMode === "legs" ? "One-way" : "Round-trip"} duration chart`}
              >
                <div className="chart-axis">
                  <span>{chartMode === "legs" ? "30" : "60"}</span>
                  <span>{chartMode === "legs" ? "15" : "30"}</span>
                  <span>0 min</span>
                </div>
                <div className="duration-bars">
                  {chartRuns.map((r, i) => (
                    <div
                      className="bar-group"
                      key={r.id}
                      title={`Run ${i + 1}: outbound ${r.hotelArrival - r.depart} min, return ${r.airportReturn! - r.hotelDepart} min, round trip ${r.airportReturn! - r.depart} min`}
                    >
                      {chartMode === "legs" ? (
                        <>
                          <i
                            className="outbound-bar"
                            style={{
                              height: `${((r.hotelArrival - r.depart) / 30) * 100}%`,
                            }}
                          />
                          <i
                            className="return-bar"
                            style={{
                              height: `${((r.airportReturn! - r.hotelDepart) / 30) * 100}%`,
                            }}
                          />
                        </>
                      ) : (
                        <i
                          className="cycle-bar"
                          style={{
                            height: `${Math.min(100, ((r.airportReturn! - r.depart) / 60) * 100)}%`,
                          }}
                        />
                      )}
                      <small>{String(i + 1).padStart(2, "0")}</small>
                    </div>
                  ))}
                </div>
              </div>
              <div className="performance-key">
                {chartMode === "legs" ? (
                  <>
                    <span>
                      <i />
                      To hotel
                    </span>
                    <span>
                      <i />
                      To airport
                    </span>
                  </>
                ) : (
                  <span>
                    <i />
                    Full cycle incl. hotel stop
                  </span>
                )}
                <small>{chartRuns.length} completed · demo</small>
              </div>
            </>
          )}
        </section>
        {shuttle ? (
          <section className="arrivals-panel">
            <div className="section-heading">
              <h3>
                Inbound to{" "}
                {station === "t1"
                  ? "T1 ground"
                  : station === "t3"
                    ? "T3 ground"
                    : station === "venetian"
                      ? "Venetian"
                      : "Virgin"}
              </h3>
              <span className="tiny-count">{inbound.length}</span>
            </div>
            {inbound.length ? (
              inbound.slice(0, 3).map((v) => (
                <button
                  key={v.id}
                  className="arrival-row"
                  onClick={() => setSelected(v.id)}
                >
                  <span className="arrival-icon">
                    <ArrowDownLeft size={16} />
                  </span>
                  <span>
                    <strong>{v.driver}</strong>
                    <small>
                      {v.name} · {phaseLabel(v)}
                    </small>
                  </span>
                  <b className={timing(v).stale ? "muted" : ""}>
                    {timing(v).stale ? "GPS stale" : `${timing(v).eta} min`}
                  </b>
                </button>
              ))
            ) : (
              <p className="no-arrivals">
                No vehicles inbound. Check vehicles at the stop below.
              </p>
            )}
            <div className="arrival-footnote">
              <Signal size={12} /> ETAs are illustrative in this demo.
            </div>
          </section>
        ) : (
          <section className="coverage-panel">
            <div className="section-heading">
              <h3>Operating hubs</h3>
              <span>4 locations</span>
            </div>
            {(["t1", "t3", "venetian", "virgin"] as Station[]).map((s, i) => (
              <button key={s} onClick={() => mapCommand(s)}>
                <span className="hub-index">0{i + 1}</span>
                <span>
                  {stations[s].short}
                  <small>
                    {isAirport(s)
                      ? "Airport ground transportation"
                      : "Hotel pickup & drop-off"}
                  </small>
                </span>
                <ArrowUpRight size={14} />
              </button>
            ))}
          </section>
        )}
        <div className="provider-footer">
          <span>
            <i /> Verizon Connect
          </span>
          <button onClick={onIntegrations}>
            Not connected <ArrowUpRight size={11} />
          </button>
        </div>
      </aside>
      {selected && (activeFleet || activeShuttle) && (
        <section
          className="vehicle-inspector"
          aria-label="Selected vehicle details"
        >
          <div className="inspector-heading">
            <div>
              <span className="micro-label">
                {shuttle ? activeShuttle?.driver : activeFleet?.driver} ·{" "}
                {shuttle ? "SHUTTLING" : "FLEET"}
              </span>
              <h2>{shuttle ? activeShuttle?.name : activeFleet?.name}</h2>
            </div>
            <button
              className="quiet-button"
              aria-label="Close vehicle details"
              onClick={() => setSelected(null)}
            >
              <X size={17} />
            </button>
          </div>
          {shuttle && activeShuttle ? (
            <>
              <div className="inspector-status">
                <span style={{ color: shuttleColor(activeShuttle) }}>
                  <i />
                  {phaseLabel(activeShuttle)}
                </span>
                <small>
                  {timing(activeShuttle).stale
                    ? "Last GPS 4+ min ago"
                    : `GPS ${activeShuttle.freshnessSeconds}s ago · demo`}
                </small>
              </div>
              <div className="inspector-times">
                <div>
                  <span>Current leg / stop</span>
                  <strong>
                    {timing(activeShuttle).elapsed}
                    <small>min</small>
                  </strong>
                </div>
                <div>
                  <span>Round-trip elapsed</span>
                  <strong>
                    {timing(activeShuttle).cycle ?? "—"}
                    <small>min</small>
                  </strong>
                </div>
                <div>
                  <span>Route leg average</span>
                  <strong>
                    {timing(activeShuttle).expected ?? "—"}
                    <small>min</small>
                  </strong>
                </div>
              </div>
              {timing(activeShuttle).attention && (
                <div className="review-note">
                  <TriangleAlert size={14} />
                  {timing(activeShuttle).stale
                    ? "GPS is stale. Arrival estimate unavailable."
                    : timing(activeShuttle).attention === "dwell"
                      ? `At stop for ${timing(activeShuttle).elapsed} min. Check boarding progress.`
                      : `${timing(activeShuttle).over} min beyond the review threshold. Check traffic and driver status.`}
                </div>
              )}
              <div className="boarding-control">
                <span>
                  <Users size={14} /> On board{" "}
                  <b>
                    {activeShuttle.passengers} / {activeShuttle.capacity}
                  </b>
                </span>
                <button
                  aria-label="Remove passenger"
                  disabled={activeShuttle.passengers === 0}
                  onClick={() =>
                    setShuttles(
                      shuttles.map((v) =>
                        v.id === selected
                          ? { ...v, passengers: v.passengers - 1 }
                          : v,
                      ),
                    )
                  }
                >
                  <Minus size={14} />
                </button>
                <button
                  aria-label="Add passenger"
                  disabled={activeShuttle.passengers === activeShuttle.capacity}
                  onClick={() =>
                    setShuttles(
                      shuttles.map((v) =>
                        v.id === selected
                          ? { ...v, passengers: v.passengers + 1 }
                          : v,
                      ),
                    )
                  }
                >
                  <Plus size={14} />
                </button>
              </div>
              <button
                className="advance-trip"
                disabled={timing(activeShuttle).stale}
                onClick={() => advance(activeShuttle)}
              >
                {moveLabel(activeShuttle)}
                <ArrowRight size={14} />
              </button>
              <p className="inspector-note">
                Manual event · demo workspace only
              </p>
            </>
          ) : activeFleet && activeSnap ? (
            <>
              <div className="inspector-status">
                <span style={{ color: activeFleet.color }}>
                  <i />
                  {activeSnap.status}
                </span>
                <small>{activeFleet.driver}</small>
              </div>
              <div className="fleet-inspector-values">
                <span>
                  <Users size={15} />
                  {activeSnap.passengers} / {activeFleet.capacity} guests
                </span>
                <span>
                  <Fuel size={15} />
                  {activeFleet.fuel}% fuel
                </span>
              </div>
              <div className="inspector-destination">
                <MapPin size={14} />
                {activeSnap.destination}
                <b>{activeSnap.eta ? `${activeSnap.eta} min` : "—"}</b>
              </div>
            </>
          ) : null}
          <button className="camera-link" onClick={onIntegrations}>
            <Video size={14} /> Road + driver cameras{" "}
            <span>
              Connect Verizon <ArrowUpRight size={12} />
            </span>
          </button>
        </section>
      )}
      <section className={"fleet-dock " + (expanded ? "expanded" : "")}>
        <div className="dock-heading">
          <button
            className="dock-title"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
          >
            <BusFront size={16} />
            {shuttle ? "Shuttle vehicles" : "Vehicle activity"}
            <span>{shuttle ? routeVehicles.length : fleet.length}</span>
            {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
          <div className="dock-filters">
            {(shuttle
              ? ["All", "Needs review", "Inbound", "At stop"]
              : ["All", "On trip", "Available"]
            ).map((f) => (
              <button
                key={f}
                className={filter === f ? "active" : ""}
                onClick={() => {
                  setFilter(f);
                  setExpanded(true);
                }}
              >
                {f}
              </button>
            ))}
          </div>
          <label className="dock-search">
            <Search size={14} />
            <input
              aria-label="Search vehicles"
              placeholder="Find vehicle or driver"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setExpanded(true);
              }}
            />
          </label>
        </div>
        <div className="dock-content">
          {shuttle ? (
            <div className="shuttle-table">
              <table>
                <thead>
                  <tr>
                    <th>VEHICLE / DRIVER</th>
                    <th>LOCATION / LEG</th>
                    <th>ELAPSED</th>
                    <th>ROUND TRIP</th>
                    <th>STATUS</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {visibleShuttles.map((v) => {
                    const t = timing(v);
                    return (
                      <tr
                        key={v.id}
                        className={selected === v.id ? "selected-row" : ""}
                      >
                        <td>
                          <button
                            className="row-vehicle"
                            aria-label={`View ${v.name}`}
                            onClick={() => setSelected(v.id)}
                          >
                            <i style={{ background: shuttleColor(v) }} />
                            <span>
                              {v.name}
                              <small>{v.driver}</small>
                            </span>
                          </button>
                        </td>
                        <td>{phaseLabel(v)}</td>
                        <td className={t.over && !t.stale ? "late-time" : ""}>
                          {t.elapsed} min
                          <small>
                            {t.expected ? `${t.expected} min avg.` : "At stop"}
                          </small>
                        </td>
                        <td>{t.cycle === null ? "—" : `${t.cycle} min`}</td>
                        <td>
                          <span
                            className={
                              "review-status " +
                              (t.attention ? "needs-review" : "")
                            }
                          >
                            {t.stale
                              ? "GPS stale"
                              : t.attention === "dwell"
                                ? "Loading delay"
                                : t.attention === "travel"
                                  ? `+${t.over} min · review`
                                  : "On track"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="quiet-button"
                            aria-label={`Inspect ${v.name}`}
                            onClick={() => setSelected(v.id)}
                          >
                            <ArrowUpRight size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {visibleShuttles.length === 0 && (
                <p className="dock-empty">No vehicles match this view.</p>
              )}
            </div>
          ) : (
            <div className="fleet-cards">
              {visibleFleet.map(({ v, snap }) => (
                <button
                  className={
                    "fleet-mini " + (selected === v.id ? "selected" : "")
                  }
                  key={v.id}
                  aria-label={`View ${v.name}`}
                  onClick={() => setSelected(v.id)}
                >
                  <span className="mini-bus" style={{ color: v.color }}>
                    <BusFront size={19} />
                  </span>
                  <span>
                    <strong>{v.name}</strong>
                    <small>{v.driver}</small>
                  </span>
                  <span
                    className="mini-status"
                    style={{ color: statusColors[snap.status] }}
                  >
                    {snap.status}
                    <small>{snap.eta ? `${snap.eta} min` : "—"}</small>
                  </span>
                </button>
              ))}
              {visibleFleet.length === 0 && (
                <p className="dock-empty">No vehicles match your search.</p>
              )}
            </div>
          )}
        </div>
      </section>
      <div className="timeline-control">
        <button
          aria-label={playing ? "Pause simulation" : "Play simulation"}
          className="timeline-play"
          onClick={() => setPlaying(!playing)}
        >
          {playing ? <Pause size={14} /> : <Play size={14} />}
        </button>
        <span className="timeline-label">
          {shuttle ? "DEMO REPLAY" : "24-HOUR REPLAY"}{" "}
          <small>{playing ? "Running" : "Paused"}</small>
        </span>
        <span className="timeline-start">{shuttle ? "20:18" : "00:00"}</span>
        <input
          aria-label="Simulation time"
          type="range"
          min={shuttle ? SESSION_START : 0}
          max={shuttle ? SESSION_START + 15 : FLEET_DAY_MINUTES - 1}
          step={shuttle ? 0.25 : 1}
          value={minute}
          onChange={(e) => {
            const next = Number(e.target.value);
            if (shuttle && next < minute && hasRecordedEvents) {
              setNote(
                "Reset the example shift before rewinding recorded events.",
              );
              return;
            }
            setPlaying(false);
            if (shuttle) setShuttleMinute(next);
            else setFleetMinute(next);
          }}
        />
        <span className="timeline-clock">
          {formatTime(minute)}
          <small>PDT</small>
        </span>
        <button
          className="quiet-button"
          aria-label="Reset example shift"
          onClick={reset}
        >
          <RotateCcw size={14} />
        </button>
        <button className="new-trip-map" onClick={onNewTrip}>
          <Plus size={14} /> New trip
        </button>
      </div>
      <div className="map-bottom-note">
        <span>
          <Radio size={10} />{" "}
          {shuttle
            ? "Simulated positions · no live tracking"
            : "Valley-wide demo day · suburb runs by day, Strip hops at night"}
        </span>
        <span>Drag to pan · right-drag to rotate</span>
      </div>
      {note && (
        <div className="operation-notice" role="status">
          <Check size={15} />
          {note}
        </div>
      )}
    </main>
  );
}
