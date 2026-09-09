import roadRoutes from "./map/routes.json" with { type: "json" };
export type Hotel = "venetian" | "virgin";
export type Station = "airport" | Hotel;
export type Direction = "outbound" | "return";
export type ShuttlePhase =
  "outbound" | "return" | "loading" | "hotel-stop" | "standby";
export const stations: Record<
  Station,
  { name: string; short: string; coordinates: [number, number] }
> = {
  airport: {
    name: "Harry Reid International",
    short: "Airport · LAS",
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
  driver: string;
  hotel: Hotel;
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
    id: "VB-01",
    driver: "Marcus Johnson",
    hotel: "venetian",
    phase: "outbound",
    phaseStarted: 1201,
    cycleStarted: 1201,
    passengers: 24,
    capacity: 30,
    progress: 0.71,
    freshnessSeconds: 8,
  },
  {
    id: "VB-02",
    driver: "Sofia Martinez",
    hotel: "venetian",
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
    id: "VB-03",
    driver: "James Wilson",
    hotel: "venetian",
    phase: "outbound",
    phaseStarted: 1187,
    cycleStarted: 1187,
    passengers: 18,
    capacity: 24,
    progress: 0.82,
    freshnessSeconds: 6,
  },
  {
    id: "VB-04",
    driver: "Alex Rivera",
    hotel: "venetian",
    phase: "loading",
    phaseStarted: 1204,
    cycleStarted: null,
    passengers: 18,
    capacity: 30,
    progress: 0,
    freshnessSeconds: 4,
  },
  {
    id: "VB-05",
    driver: "Daniel Kim",
    hotel: "venetian",
    phase: "hotel-stop",
    phaseStarted: 1214,
    cycleStarted: 1193,
    hotelArrival: 1214,
    passengers: 0,
    capacity: 35,
    progress: 1,
    freshnessSeconds: 11,
  },
  {
    id: "VB-06",
    driver: "Taylor Brooks",
    hotel: "venetian",
    phase: "return",
    phaseStarted: 1208,
    cycleStarted: 1180,
    hotelArrival: 1201,
    hotelDepart: 1208,
    passengers: 0,
    capacity: 20,
    progress: 0.45,
    freshnessSeconds: 248,
  },
  {
    id: "VB-08",
    driver: "Sam Parker",
    hotel: "virgin",
    phase: "outbound",
    phaseStarted: 1209,
    cycleStarted: 1209,
    passengers: 16,
    capacity: 24,
    progress: 0.66,
    freshnessSeconds: 7,
  },
  {
    id: "VB-09",
    driver: "Casey Lee",
    hotel: "virgin",
    phase: "return",
    phaseStarted: 1211,
    cycleStarted: 1192,
    hotelArrival: 1204,
    hotelDepart: 1211,
    passengers: 0,
    capacity: 30,
    progress: 0.5,
    freshnessSeconds: 9,
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
export function vehicleTiming(
  v: ShuttleVehicle,
  minute: number,
  travelBuffer = 5,
  dwellLimit = 10,
  runs = completedRuns,
) {
  const elapsed = Math.max(0, Math.floor(minute - v.phaseStarted));
  const moving = v.phase === "outbound" || v.phase === "return";
  const expected = moving
    ? routeStats(v.hotel, runs)[v.phase as Direction]
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
  return station === "airport"
    ? v.phase === "return"
    : v.hotel === station && v.phase === "outbound";
}
export function atStation(v: ShuttleVehicle, station: Station) {
  return station === "airport"
    ? v.phase === "loading" || v.phase === "standby"
    : v.hotel === station && v.phase === "hotel-stop";
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
  if (v.freshnessSeconds > 120 || !["outbound", "return"].includes(v.phase))
    return v.progress;
  const delta =
    (minute - (v.positionMinute ?? SESSION_START)) /
    Math.max(1, routeStats(v.hotel, runs)[v.phase as Direction] ?? 20);
  return Math.min(0.97, Math.max(0.03, v.progress + delta));
}
export function phaseLabel(v: ShuttleVehicle) {
  return {
    outbound: `To ${v.hotel === "venetian" ? "Venetian" : "Virgin"}`,
    return: "To airport",
    loading: "Loading at airport",
    "hotel-stop": "At hotel",
    standby: "Ready at airport",
  }[v.phase];
}
