import roadRoutes from "./map/routes.json" with { type: "json" };
export type Hotel = "venetian" | "virgin";
export type Terminal = "t1" | "t3";
export type Station = Terminal | Hotel;
export type Direction = "outbound" | "return";
export type ShuttlePhase =
  | "outbound"
  | "return"
  | "loading"
  | "hotel-stop"
  | "standby"
  | "terminal-hop";
export const isAirport = (s: Station): s is Terminal => s === "t1" || s === "t3";
export const stations: Record<
  Station,
  { name: string; short: string; coordinates: [number, number] }
> = {
  t1: {
    name: "Terminal 1 ground transportation",
    short: "T1 ground",
    coordinates: [-115.1455, 36.0838],
  },
  t3: {
    name: "Terminal 3 ground transportation",
    short: "T3 ground",
    coordinates: [-115.1483, 36.0851],
  },
  venetian: {
    name: "The Venetian",
    short: "The Venetian",
    coordinates: [-115.1697, 36.1212],
  },
  virgin: {
    name: "Virgin Hotels",
    short: "Virgin Hotels",
    coordinates: [-115.1536, 36.1097],
  },
};
export const routes = roadRoutes as Record<Hotel, [number, number][]>;
export const SESSION_START = 20 * 60 + 18;
export type CompletedRun = {
  id: string;
  hotel: Hotel;
  depart: number;
  hotelArrival: number;
  hotelDepart: number;
  airportReturn: number | null;
};
export const completedRuns: CompletedRun[] = [
  ...[18, 22, 20, 24, 21, 19, 25, 23].map((out, i) => ({
    id: `C-${i}`,
    hotel: "venetian" as Hotel,
    depart: 960 + i * 16,
    hotelArrival: 960 + i * 16 + out,
    hotelDepart: 960 + i * 16 + out + 7,
    airportReturn: 960 + i * 16 + out + 7 + [19, 20, 18, 22, 21, 20, 24, 20][i],
  })),
  ...[12, 14, 13, 15].map((out, i) => ({
    id: `V-${i}`,
    hotel: "virgin" as Hotel,
    depart: 980 + i * 20,
    hotelArrival: 980 + i * 20 + out,
    hotelDepart: 980 + i * 20 + out + 5,
    airportReturn: 980 + i * 20 + out + 5 + [13, 12, 14, 15][i],
  })),
];
export type ShuttleVehicle = {
  id: string;
  name: string;
  driver: string;
  hotel: Hotel;
  terminal: Terminal;
  phase: ShuttlePhase;
  phaseStarted: number;
  cycleStarted: number | null;
  passengers: number;
  capacity: number;
  progress: number;
  positionMinute?: number;
  freshnessSeconds: number;
  hotelArrival?: number;
  hotelDepart?: number;
};
export const shuttleFleet: ShuttleVehicle[] = [
  {
    id: "DL-01",
    name: "Buffalo",
    driver: "Marcus Johnson",
    hotel: "venetian",
    terminal: "t1",
    phase: "outbound",
    phaseStarted: 1201,
    cycleStarted: 1201,
    passengers: 24,
    capacity: 40,
    progress: 0.71,
    freshnessSeconds: 8,
  },
  {
    id: "DL-02",
    name: "Big Money",
    driver: "Sofia Martinez",
    hotel: "venetian",
    terminal: "t1",
    phase: "return",
    phaseStarted: 1206,
    cycleStarted: 1176,
    hotelArrival: 1197,
    hotelDepart: 1206,
    passengers: 0,
    capacity: 40,
    progress: 0.64,
    freshnessSeconds: 12,
  },
  {
    id: "DL-03",
    name: "Bankroll",
    driver: "James Wilson",
    hotel: "venetian",
    terminal: "t1",
    phase: "outbound",
    phaseStarted: 1187,
    cycleStarted: 1187,
    passengers: 18,
    capacity: 38,
    progress: 0.82,
    freshnessSeconds: 6,
  },
  {
    id: "DL-04",
    name: "Let It Ride",
    driver: "Alex Rivera",
    hotel: "venetian",
    terminal: "t1",
    phase: "loading",
    phaseStarted: 1204,
    cycleStarted: null,
    passengers: 18,
    capacity: 38,
    progress: 0,
    freshnessSeconds: 4,
  },
  {
    id: "DL-05",
    name: "Max Bet",
    driver: "Daniel Kim",
    hotel: "venetian",
    terminal: "t1",
    phase: "hotel-stop",
    phaseStarted: 1214,
    cycleStarted: 1193,
    hotelArrival: 1214,
    passengers: 0,
    capacity: 36,
    progress: 1,
    freshnessSeconds: 11,
  },
  {
    id: "DL-06",
    name: "High Stakes",
    driver: "Taylor Brooks",
    hotel: "venetian",
    terminal: "t1",
    phase: "return",
    phaseStarted: 1208,
    cycleStarted: 1180,
    hotelArrival: 1201,
    hotelDepart: 1208,
    passengers: 0,
    capacity: 36,
    progress: 0.45,
    freshnessSeconds: 248,
  },
  {
    id: "DL-07",
    name: "Double Up",
    driver: "Jordan Davis",
    hotel: "venetian",
    terminal: "t1",
    phase: "standby",
    phaseStarted: 1210,
    cycleStarted: null,
    passengers: 0,
    capacity: 30,
    progress: 0,
    freshnessSeconds: 9,
  },
  {
    id: "DL-08",
    name: "Executive 1",
    driver: "Sam Parker",
    hotel: "virgin",
    terminal: "t3",
    phase: "outbound",
    phaseStarted: 1209,
    cycleStarted: 1209,
    passengers: 16,
    capacity: 27,
    progress: 0.66,
    freshnessSeconds: 7,
  },
  {
    id: "DL-09",
    name: "Executive 2",
    driver: "Casey Lee",
    hotel: "venetian",
    terminal: "t1",
    phase: "terminal-hop",
    phaseStarted: 1212,
    cycleStarted: null,
    passengers: 0,
    capacity: 27,
    progress: 0.42,
    freshnessSeconds: 5,
  },
  {
    id: "DL-10",
    name: "Side Bet",
    driver: "Drew Morgan",
    hotel: "venetian",
    terminal: "t3",
    phase: "loading",
    phaseStarted: 1215,
    cycleStarted: null,
    passengers: 6,
    capacity: 12,
    progress: 0,
    freshnessSeconds: 6,
  },
];
const average = (values: number[]) =>
  values.length
    ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
    : null;
export function routeStats(hotel: Hotel, runs = completedRuns) {
  const matching = runs.filter((r) => r.hotel === hotel);
  const complete = matching.filter((r) => r.airportReturn !== null);
  return {
    outbound: average(matching.map((r) => r.hotelArrival - r.depart)),
    return: average(complete.map((r) => r.airportReturn! - r.hotelDepart)),
    roundTrip: average(complete.map((r) => r.airportReturn! - r.depart)),
    dwell: average(matching.map((r) => r.hotelDepart - r.hotelArrival)),
    completed: complete.length,
  };
}
export const ROUTE_MILES = { venetian: 4.8, virgin: 3.2 } as const;
const round1 = (n: number) => Math.round(n * 10) / 10;
export function shuttleBoard(hotel: Hotel, runs = completedRuns) {
  const stats = routeStats(hotel, runs);
  const oneWayMiles = ROUTE_MILES[hotel];
  const roundMiles = round1(oneWayMiles * 2);
  const guestsPerCycle = hotel === "venetian" ? 22 : 10;
  return {
    ...stats,
    airport: hotel === "venetian" ? "T1 / T3" : "T3",
    hotelName: hotel === "venetian" ? "The Venetian" : "Virgin Hotels",
    oneWayMiles,
    roundMiles,
    milesDriven: round1(stats.completed * roundMiles),
    dropOffs: stats.completed,
    guests: stats.completed * guestsPerCycle,
  };
}
export function driverRotation(
  v: ShuttleVehicle,
  minute: number,
  runs = completedRuns,
) {
  const stats = routeStats(v.hotel, runs);
  const timing = vehicleTiming(v, minute, 5, 10, runs);
  const oneWay = ROUTE_MILES[v.hotel];
  const expected =
    v.phase === "outbound"
      ? stats.outbound
      : v.phase === "return"
        ? stats.return
        : v.phase === "hotel-stop" || v.phase === "loading"
          ? stats.dwell
          : v.phase === "terminal-hop"
            ? 8
            : null;
  const miles =
    v.phase === "outbound"
      ? round1(oneWay * v.progress)
      : v.phase === "return"
        ? round1(oneWay + oneWay * v.progress)
        : v.phase === "hotel-stop"
          ? oneWay
          : 0;
  return {
    id: v.id,
    name: v.name,
    driver: v.driver,
    phase: v.phase,
    elapsed: timing.elapsed,
    expected,
    miles,
    guests: v.passengers,
    attention: timing.attention,
  };
}
export function vehicleTiming(
  v: ShuttleVehicle,
  minute: number,
  travelBuffer = 5,
  dwellLimit = 10,
  runs = completedRuns,
) {
  const elapsed = Math.max(0, Math.floor(minute - v.phaseStarted));
  const moving =
    v.phase === "outbound" ||
    v.phase === "return" ||
    v.phase === "terminal-hop";
  const hopMinutes = 8;
  const expected = moving
    ? v.phase === "terminal-hop"
      ? hopMinutes
      : routeStats(v.hotel, runs)[v.phase as Direction]
    : null;
  const threshold = moving ? (expected ?? 20) + travelBuffer : dwellLimit;
  const stale = v.freshnessSeconds > 120;
  const over = Math.max(0, Math.ceil(elapsed - threshold));
  const eta =
    moving && !stale
      ? Math.max(
          1,
          Math.ceil((expected ?? 20) * (1 - progressAt(v, minute, runs))),
        )
      : null;
  return {
    elapsed,
    expected,
    threshold,
    over,
    stale,
    eta,
    attention: stale
      ? "stale"
      : over > 0
        ? moving
          ? "travel"
          : "dwell"
        : null,
    cycle:
      v.cycleStarted === null
        ? null
        : Math.max(0, Math.floor(minute - v.cycleStarted)),
  };
}
export function inboundTo(v: ShuttleVehicle, station: Station) {
  if (isAirport(station))
    return v.phase === "return" && v.terminal === station;
  return v.hotel === station && v.phase === "outbound";
}
export function atStation(v: ShuttleVehicle, station: Station) {
  if (isAirport(station))
    return (
      v.terminal === station &&
      (v.phase === "loading" || v.phase === "standby")
    );
  return v.hotel === station && v.phase === "hotel-stop";
}
export function terminalHopCoordinate(fraction: number): [number, number] {
  const a = stations.t1.coordinates,
    b = stations.t3.coordinates;
  const t = Math.max(0, Math.min(1, fraction));
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}
export function coordinateAlong(
  hotel: Hotel,
  fraction: number,
): [number, number] {
  const path = routes[hotel];
  const lengths = path
    .slice(1)
    .map((p, i) => Math.hypot((p[0] - path[i][0]) * 0.81, p[1] - path[i][1]));
  const total = lengths.reduce((a, b) => a + b, 0);
  let distance = Math.max(0, Math.min(1, fraction)) * total;
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i]) {
      const t = lengths[i] ? distance / lengths[i] : 0;
      return [
        path[i][0] + (path[i + 1][0] - path[i][0]) * t,
        path[i][1] + (path[i + 1][1] - path[i][1]) * t,
      ];
    }
    distance -= lengths[i];
  }
  return path[path.length - 1];
}
export function progressAt(
  v: ShuttleVehicle,
  minute: number,
  runs = completedRuns,
) {
  const moving =
    v.phase === "outbound" ||
    v.phase === "return" ||
    v.phase === "terminal-hop";
  if (v.freshnessSeconds > 120 || !moving) return v.progress;
  const expected =
    v.phase === "terminal-hop"
      ? 8
      : (routeStats(v.hotel, runs)[v.phase as Direction] ?? 20);
  const delta =
    (minute - (v.positionMinute ?? SESSION_START)) / Math.max(1, expected);
  return Math.min(0.97, Math.max(0.03, v.progress + delta));
}
export function phaseLabel(v: ShuttleVehicle) {
  const pad = v.terminal === "t3" ? "T3" : "T1";
  return {
    outbound: `To ${v.hotel === "venetian" ? "Venetian" : "Virgin"}`,
    return: `To airport · ${pad} ground`,
    loading: `Loading at ${pad} ground`,
    "hotel-stop": "At hotel · return to airport next",
    standby: `Holding at ${pad} ground`,
    "terminal-hop": "T1 → T3 ground",
  }[v.phase];
}
