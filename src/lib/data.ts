import { SESSION_START } from "./shuttling";

export type Status = "On trip" | "Available" | "To pickup" | "Offline";
export type Vehicle = {
  id: string;
  name: string;
  driver: string;
  capacity: number;
  passengers: number;
  status: Status;
  lat: number;
  lng: number;
  destination: string;
  eta: number;
  fuel: number;
  path: [number, number][];
};
export const fleet: Vehicle[] = [
  {
    id: "DL-01",
    name: "Buffalo",
    driver: "Marcus Johnson",
    capacity: 40,
    passengers: 28,
    status: "On trip",
    lat: 36.114,
    lng: -115.173,
    destination: "Wynn Las Vegas",
    eta: 8,
    fuel: 78,
    path: [
      [-115.173, 36.114],
      [-115.172, 36.118],
      [-115.168, 36.122],
    ],
  },
  {
    id: "DL-02",
    name: "Big Money",
    driver: "Sofia Martinez",
    capacity: 40,
    passengers: 32,
    status: "On trip",
    lat: 36.121,
    lng: -115.17,
    destination: "Harry Reid · T1 ground",
    eta: 14,
    fuel: 65,
    path: [
      [-115.1697, 36.1212],
      [-115.16, 36.11],
      [-115.1483, 36.09],
      [-115.1455, 36.0838],
    ],
  },
  {
    id: "DL-03",
    name: "Bankroll",
    driver: "James Wilson",
    capacity: 38,
    passengers: 22,
    status: "On trip",
    lat: 36.099,
    lng: -115.178,
    destination: "The Venetian",
    eta: 11,
    fuel: 82,
    path: [
      [-115.1455, 36.0838],
      [-115.16, 36.1],
      [-115.1697, 36.1212],
    ],
  },
  {
    id: "DL-04",
    name: "Let It Ride",
    driver: "Alex Rivera",
    capacity: 38,
    passengers: 0,
    status: "Available",
    lat: 36.0838,
    lng: -115.1455,
    destination: "Holding · T1 ground",
    eta: 0,
    fuel: 92,
    path: [
      [-115.1455, 36.0838],
      [-115.1456, 36.0839],
    ],
  },
  {
    id: "DL-05",
    name: "Max Bet",
    driver: "Daniel Kim",
    capacity: 36,
    passengers: 28,
    status: "On trip",
    lat: 36.1212,
    lng: -115.1697,
    destination: "The Venetian",
    eta: 3,
    fuel: 58,
    path: [
      [-115.16, 36.105],
      [-115.1697, 36.1212],
    ],
  },
  {
    id: "DL-06",
    name: "High Stakes",
    driver: "Taylor Brooks",
    capacity: 36,
    passengers: 0,
    status: "On trip",
    lat: 36.1,
    lng: -115.158,
    destination: "Harry Reid · T1 ground",
    eta: 9,
    fuel: 74,
    path: [
      [-115.1697, 36.1212],
      [-115.155, 36.1],
      [-115.1455, 36.0838],
    ],
  },
  {
    id: "DL-07",
    name: "Double Up",
    driver: "Jordan Davis",
    capacity: 30,
    passengers: 0,
    status: "Available",
    lat: 36.0839,
    lng: -115.1457,
    destination: "Holding · T1 ground",
    eta: 0,
    fuel: 88,
    path: [
      [-115.1457, 36.0839],
      [-115.1458, 36.084],
    ],
  },
  {
    id: "DL-08",
    name: "Executive 1",
    driver: "Sam Parker",
    capacity: 27,
    passengers: 16,
    status: "To pickup",
    lat: 36.1097,
    lng: -115.1536,
    destination: "Virgin Hotels",
    eta: 6,
    fuel: 87,
    path: [
      [-115.1483, 36.0851],
      [-115.1536, 36.1097],
    ],
  },
  {
    id: "DL-09",
    name: "Executive 2",
    driver: "Casey Lee",
    capacity: 27,
    passengers: 0,
    status: "To pickup",
    lat: 36.0844,
    lng: -115.1468,
    destination: "T3 ground",
    eta: 4,
    fuel: 81,
    path: [
      [-115.1455, 36.0838],
      [-115.1483, 36.0851],
    ],
  },
  {
    id: "DL-10",
    name: "Side Bet",
    driver: "Drew Morgan",
    capacity: 12,
    passengers: 0,
    status: "Available",
    lat: 36.0851,
    lng: -115.1483,
    destination: "Holding · T3 ground",
    eta: 0,
    fuel: 95,
    path: [
      [-115.1483, 36.0851],
      [-115.1484, 36.0852],
    ],
  },
  {
    id: "DL-11",
    name: "Escalade",
    driver: "Jamie Chen",
    capacity: 6,
    passengers: 0,
    status: "To pickup",
    lat: 36.108,
    lng: -115.176,
    destination: "Bellagio",
    eta: 7,
    fuel: 70,
    path: [
      [-115.176, 36.108],
      [-115.1766, 36.1126],
    ],
  },
  {
    id: "DL-12",
    name: "Executive 3",
    driver: "Unassigned",
    capacity: 27,
    passengers: 0,
    status: "Offline",
    lat: 36.149,
    lng: -115.211,
    destination: "Maintenance · depot",
    eta: 0,
    fuel: 42,
    path: [
      [-115.211, 36.149],
      [-115.211, 36.149],
    ],
  },
];
export const colors: Record<Status, string> = {
  "On trip": "#e2c48a",
  Available: "#9ad0c6",
  "To pickup": "#d7b48a",
  Offline: "#73808e",
};
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
export function fleetCoordinate(
  v: Vehicle,
  minute: number,
): [number, number] {
  const path = v.path;
  if (v.status === "Offline" || path.length < 2) return [v.lng, v.lat];
  const t = Math.max(0, Math.min(1, (minute - SESSION_START) / 15));
  const scaled = v.status === "Available" ? t * 0.08 : t;
  const lengths = path
    .slice(1)
    .map((p, i) => Math.hypot(p[0] - path[i][0], p[1] - path[i][1]));
  const total = lengths.reduce((a, b) => a + b, 0) || 1;
  let distance = scaled * total;
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i]) {
      const u = lengths[i] ? distance / lengths[i] : 0;
      return [
        path[i][0] + (path[i + 1][0] - path[i][0]) * u,
        path[i][1] + (path[i + 1][1] - path[i][1]) * u,
      ];
    }
    distance -= lengths[i];
  }
  return path[path.length - 1];
}
export function readSaved<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}
