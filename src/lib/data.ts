export type Status = "On trip" | "Available" | "To pickup" | "Offline";
export type PlaceId = keyof typeof places;
export const FLEET_DAY_MINUTES = 24 * 60;
export const FLEET_EVENING = 20 * 60 + 18;
export const places = {
  "Centennial Hills": [-115.268, 36.275],
  "North Las Vegas": [-115.146, 36.219],
  Henderson: [-115.037, 36.039],
  "Southern Highlands": [-115.207, 35.997],
  "Mountain's Edge": [-115.27, 36.018],
  "Spring Valley": [-115.245, 36.113],
  Summerlin: [-115.326, 36.168],
  Downtown: [-115.136, 36.169],
  Chinatown: [-115.202, 36.126],
  "The Strip · Venetian": [-115.1697, 36.1212],
  "The Strip · Bellagio": [-115.1766, 36.1126],
  "The Strip · Wynn": [-115.165, 36.128],
  "The Strip · MGM": [-115.169, 36.102],
  "The Strip · Resorts World": [-115.166, 36.137],
  "Harry Reid · T1": [-115.1455, 36.0838],
  "Harry Reid · T3": [-115.1483, 36.0851],
  Depot: [-115.211, 36.149],
} as const satisfies Record<string, readonly [number, number]>;
export type FleetLeg = {
  start: number;
  end: number;
  from: PlaceId;
  to: PlaceId;
  passengers: number;
};
export type Vehicle = {
  id: string;
  name: string;
  driver: string;
  capacity: number;
  color: string;
  fuel: number;
  legs: FleetLeg[];
};
const wrap = (minute: number) =>
  ((Math.floor(minute) % FLEET_DAY_MINUTES) + FLEET_DAY_MINUTES) %
  FLEET_DAY_MINUTES;
const leg = (
  start: number,
  duration: number,
  from: PlaceId,
  to: PlaceId,
  passengers: number,
): FleetLeg => ({
  start,
  end: start + duration,
  from,
  to,
  passengers,
});
const along = (
  a: readonly [number, number],
  b: readonly [number, number],
  t: number,
): [number, number] => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
];
const parkSpread = (
  id: string,
  at: readonly [number, number],
  radius = 0.0042,
): [number, number] => {
  const i = Math.max(1, Number(id.replace(/\D/g, "")) || 1) - 1;
  const col = i % 4;
  const row = Math.floor(i / 4);
  return [
    at[0] + (col - 1.5) * radius,
    at[1] + (row - 1) * radius * 0.85,
  ];
};
export const fleet: Vehicle[] = [
  {
    id: "DL-01",
    name: "Buffalo",
    driver: "Marcus Johnson",
    capacity: 40,
    color: "#e2c48a",
    fuel: 78,
    legs: [
      leg(7 * 60, 50, "Centennial Hills", "Harry Reid · T1", 28),
      leg(8 * 60 + 10, 40, "Harry Reid · T1", "The Strip · Venetian", 32),
      leg(10 * 60, 55, "The Strip · Venetian", "Henderson", 22),
      leg(13 * 60, 50, "Henderson", "Spring Valley", 18),
      leg(16 * 60, 45, "Spring Valley", "Harry Reid · T3", 26),
      leg(18 * 60 + 15, 40, "Harry Reid · T3", "The Strip · Bellagio", 34),
      leg(20 * 60, 25, "The Strip · Bellagio", "The Strip · Wynn", 30),
      leg(21 * 60 + 20, 20, "The Strip · Wynn", "The Strip · Venetian", 28),
      leg(22 * 60 + 30, 25, "The Strip · Venetian", "Downtown", 20),
    ],
  },
  {
    id: "DL-02",
    name: "Big Money",
    driver: "Sofia Martinez",
    capacity: 40,
    color: "#5ec8e0",
    fuel: 65,
    legs: [
      leg(6 * 60 + 40, 55, "North Las Vegas", "Harry Reid · T1", 30),
      leg(8 * 60, 45, "Harry Reid · T1", "The Strip · Resorts World", 34),
      leg(11 * 60, 50, "The Strip · Resorts World", "Centennial Hills", 16),
      leg(14 * 60 + 10, 55, "Centennial Hills", "Henderson", 24),
      leg(17 * 60, 50, "Henderson", "The Strip · MGM", 36),
      leg(19 * 60 + 30, 20, "The Strip · MGM", "The Strip · Bellagio", 32),
      leg(21 * 60, 22, "The Strip · Bellagio", "The Strip · Venetian", 28),
      leg(22 * 60 + 40, 30, "The Strip · Venetian", "Harry Reid · T1", 18),
    ],
  },
  {
    id: "DL-03",
    name: "Bankroll",
    driver: "James Wilson",
    capacity: 38,
    color: "#e07a5f",
    fuel: 82,
    legs: [
      leg(7 * 60 + 20, 55, "Henderson", "Harry Reid · T3", 26),
      leg(9 * 60, 40, "Harry Reid · T3", "The Strip · Wynn", 30),
      leg(12 * 60, 50, "The Strip · Wynn", "Southern Highlands", 14),
      leg(15 * 60, 45, "Southern Highlands", "Spring Valley", 20),
      leg(18 * 60, 40, "Spring Valley", "The Strip · Venetian", 34),
      leg(20 * 60 + 10, 18, "The Strip · Venetian", "The Strip · Bellagio", 28),
      leg(21 * 60 + 40, 20, "The Strip · Bellagio", "The Strip · MGM", 24),
      leg(23 * 60, 25, "The Strip · MGM", "Downtown", 16),
    ],
  },
  {
    id: "DL-04",
    name: "Let It Ride",
    driver: "Alex Rivera",
    capacity: 38,
    color: "#7ebf9a",
    fuel: 92,
    legs: [
      leg(8 * 60, 50, "Mountain's Edge", "Harry Reid · T1", 22),
      leg(10 * 60, 45, "Harry Reid · T1", "Summerlin", 18),
      leg(13 * 60 + 10, 40, "Summerlin", "Chinatown", 12),
      leg(16 * 60 + 20, 45, "Chinatown", "The Strip · Resorts World", 28),
      leg(19 * 60, 22, "The Strip · Resorts World", "The Strip · Wynn", 30),
      leg(20 * 60 + 40, 18, "The Strip · Wynn", "The Strip · Venetian", 26),
      leg(22 * 60 + 10, 20, "The Strip · Venetian", "The Strip · Bellagio", 22),
    ],
  },
  {
    id: "DL-05",
    name: "Max Bet",
    driver: "Daniel Kim",
    capacity: 36,
    color: "#f0a868",
    fuel: 58,
    legs: [
      leg(7 * 60 + 40, 45, "Spring Valley", "Harry Reid · T3", 20),
      leg(9 * 60 + 20, 35, "Harry Reid · T3", "The Strip · Venetian", 28),
      leg(11 * 60 + 30, 50, "The Strip · Venetian", "North Las Vegas", 16),
      leg(15 * 60, 55, "North Las Vegas", "Henderson", 22),
      leg(18 * 60 + 20, 40, "Henderson", "The Strip · Bellagio", 32),
      leg(20 * 60 + 20, 16, "The Strip · Bellagio", "The Strip · MGM", 28),
      leg(21 * 60 + 30, 18, "The Strip · MGM", "The Strip · Wynn", 24),
      leg(23 * 60 + 10, 20, "The Strip · Wynn", "Downtown", 14),
    ],
  },
  {
    id: "DL-06",
    name: "High Stakes",
    driver: "Taylor Brooks",
    capacity: 36,
    color: "#d4a0d8",
    fuel: 74,
    legs: [
      leg(6 * 60 + 50, 50, "Southern Highlands", "Harry Reid · T1", 24),
      leg(8 * 60 + 30, 40, "Harry Reid · T1", "The Strip · MGM", 30),
      leg(12 * 60, 55, "The Strip · MGM", "Centennial Hills", 12),
      leg(16 * 60, 50, "Centennial Hills", "The Strip · Venetian", 28),
      leg(19 * 60 + 10, 20, "The Strip · Venetian", "The Strip · Resorts World", 26),
      leg(21 * 60, 18, "The Strip · Resorts World", "The Strip · Bellagio", 22),
      leg(22 * 60 + 20, 22, "The Strip · Bellagio", "Harry Reid · T3", 18),
    ],
  },
  {
    id: "DL-07",
    name: "Double Up",
    driver: "Jordan Davis",
    capacity: 30,
    color: "#8aa4e0",
    fuel: 88,
    legs: [
      leg(8 * 60 + 20, 45, "Summerlin", "Harry Reid · T3", 18),
      leg(10 * 60 + 30, 40, "Harry Reid · T3", "Chinatown", 14),
      leg(13 * 60, 50, "Chinatown", "Mountain's Edge", 16),
      leg(16 * 60 + 30, 45, "Mountain's Edge", "The Strip · Wynn", 24),
      leg(19 * 60 + 20, 18, "The Strip · Wynn", "The Strip · Venetian", 22),
      leg(21 * 60 + 10, 16, "The Strip · Venetian", "The Strip · MGM", 20),
      leg(22 * 60 + 40, 20, "The Strip · MGM", "Downtown", 12),
    ],
  },
  {
    id: "DL-08",
    name: "Executive 1",
    driver: "Sam Parker",
    capacity: 27,
    color: "#6fd0b5",
    fuel: 87,
    legs: [
      leg(7 * 60 + 10, 40, "Summerlin", "Harry Reid · T1", 12),
      leg(9 * 60, 35, "Harry Reid · T1", "The Strip · Resorts World", 16),
      leg(12 * 60 + 20, 45, "The Strip · Resorts World", "Henderson", 10),
      leg(16 * 60, 40, "Henderson", "The Strip · Wynn", 18),
      leg(19 * 60, 16, "The Strip · Wynn", "The Strip · Bellagio", 16),
      leg(20 * 60 + 50, 14, "The Strip · Bellagio", "The Strip · Venetian", 14),
      leg(22 * 60, 18, "The Strip · Venetian", "Harry Reid · T1", 8),
    ],
  },
  {
    id: "DL-09",
    name: "Executive 2",
    driver: "Casey Lee",
    capacity: 27,
    color: "#c9b06a",
    fuel: 81,
    legs: [
      leg(8 * 60 + 40, 50, "North Las Vegas", "The Strip · Venetian", 14),
      leg(11 * 60, 40, "The Strip · Venetian", "Spring Valley", 8),
      leg(14 * 60 + 20, 45, "Spring Valley", "Southern Highlands", 12),
      leg(17 * 60 + 30, 40, "Southern Highlands", "The Strip · MGM", 20),
      leg(20 * 60, 16, "The Strip · MGM", "The Strip · Wynn", 16),
      leg(21 * 60 + 40, 14, "The Strip · Wynn", "The Strip · Resorts World", 12),
      leg(23 * 60, 20, "The Strip · Resorts World", "Downtown", 8),
    ],
  },
  {
    id: "DL-10",
    name: "Side Bet",
    driver: "Drew Morgan",
    capacity: 12,
    color: "#f4a261",
    fuel: 95,
    legs: [
      leg(9 * 60, 40, "Spring Valley", "The Strip · Bellagio", 8),
      leg(11 * 60 + 20, 35, "The Strip · Bellagio", "Chinatown", 6),
      leg(14 * 60, 40, "Chinatown", "Summerlin", 7),
      leg(17 * 60 + 40, 30, "Summerlin", "The Strip · Venetian", 10),
      leg(19 * 60 + 40, 14, "The Strip · Venetian", "The Strip · Wynn", 10),
      leg(21 * 60 + 10, 12, "The Strip · Wynn", "The Strip · Bellagio", 8),
      leg(22 * 60 + 30, 16, "The Strip · Bellagio", "Downtown", 6),
    ],
  },
  {
    id: "DL-11",
    name: "Escalade",
    driver: "Jamie Chen",
    capacity: 6,
    color: "#90be6d",
    fuel: 70,
    legs: [
      leg(8 * 60 + 30, 35, "Henderson", "Harry Reid · T3", 4),
      leg(10 * 60, 30, "Harry Reid · T3", "The Strip · Wynn", 5),
      leg(13 * 60, 40, "The Strip · Wynn", "Centennial Hills", 3),
      leg(16 * 60 + 40, 40, "Centennial Hills", "The Strip · Bellagio", 6),
      leg(19 * 60 + 30, 12, "The Strip · Bellagio", "The Strip · Venetian", 5),
      leg(21 * 60, 12, "The Strip · Venetian", "The Strip · MGM", 4),
      leg(22 * 60 + 20, 14, "The Strip · MGM", "Downtown", 3),
    ],
  },
  {
    id: "DL-12",
    name: "Executive 3",
    driver: "Unassigned",
    capacity: 27,
    color: "#6d6a64",
    fuel: 42,
    legs: [],
  },
];
export type FleetSnapshot = {
  coordinates: [number, number];
  status: Status;
  destination: string;
  area: string;
  eta: number;
  passengers: number;
};
const currentLeg = (v: Vehicle, minute: number) => {
  const now = wrap(minute);
  return v.legs.find((item) => now >= item.start && now < item.end);
};
const lastLeg = (v: Vehicle, minute: number) => {
  const now = wrap(minute);
  return [...v.legs].reverse().find((item) => now >= item.end) ?? v.legs[0];
};
const nextLeg = (v: Vehicle, minute: number) => {
  const now = wrap(minute);
  return v.legs.find((item) => item.start > now);
};
export function fleetSnapshot(v: Vehicle, minute: number): FleetSnapshot {
  if (!v.legs.length) {
    return {
      coordinates: [...places.Depot],
      status: "Offline",
      destination: "Maintenance · depot",
      area: "Depot",
      eta: 0,
      passengers: 0,
    };
  }
  const now = wrap(minute);
  const active = currentLeg(v, now);
  if (active) {
    const t = (now - active.start) / Math.max(1, active.end - active.start);
    const approaching = t < 0.12;
    return {
      coordinates: parkSpread(
        v.id,
        along(places[active.from], places[active.to], t),
        0.0012,
      ),
      status: approaching ? "To pickup" : "On trip",
      destination: active.to,
      area: t < 0.5 ? active.from : active.to,
      eta: Math.max(1, Math.ceil(active.end - now)),
      passengers: active.passengers,
    };
  }
  const upcoming = nextLeg(v, now);
  const parked = lastLeg(v, now);
  const here = upcoming ? places[upcoming.from] : places[parked.to];
  const soon = upcoming && upcoming.start - now <= 25;
  return {
    coordinates: parkSpread(v.id, here),
    status: soon ? "To pickup" : "Available",
    destination: upcoming ? upcoming.from : parked.to,
    area: upcoming ? upcoming.from : parked.to,
    eta: upcoming ? Math.max(0, upcoming.start - now) : 0,
    passengers: 0,
  };
}
export function fleetCoordinate(v: Vehicle, minute: number): [number, number] {
  return fleetSnapshot(v, minute).coordinates;
}
export type Trip = {
  id: string;
  time: string;
  guest: string;
  pickup: string;
  dropoff: string;
  passengers: number;
  vehicle: string;
  status: string;
};
export const initialTrips: Trip[] = [
  {
    id: "TR-2041",
    time: "20:15",
    guest: "Henderson wedding party",
    pickup: "Bellagio",
    dropoff: "Wynn Las Vegas",
    passengers: 24,
    vehicle: "DL-01",
    status: "In progress",
  },
  {
    id: "TR-2042",
    time: "20:30",
    guest: "Reed birthday celebration",
    pickup: "MGM Grand",
    dropoff: "Fremont Street",
    passengers: 18,
    vehicle: "DL-11",
    status: "To pickup",
  },
  {
    id: "TR-2043",
    time: "20:45",
    guest: "Acme team night out",
    pickup: "Resorts World",
    dropoff: "The Venetian",
    passengers: 22,
    vehicle: "DL-08",
    status: "To pickup",
  },
  {
    id: "TR-2044",
    time: "21:00",
    guest: "Airport group transfer",
    pickup: "Harry Reid · T1 ground",
    dropoff: "The Venetian",
    passengers: 16,
    vehicle: "DL-03",
    status: "Scheduled",
  },
];
export function readSaved<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}
