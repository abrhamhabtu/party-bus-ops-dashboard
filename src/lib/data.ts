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
};
export const fleet: Vehicle[] = [
  {
    id: "VB-01",
    name: "Midnight Express",
    driver: "Marcus Johnson",
    capacity: 30,
    passengers: 24,
    status: "On trip",
    lat: 36.114,
    lng: -115.173,
    destination: "Wynn Las Vegas",
    eta: 8,
    fuel: 78,
  },
  {
    id: "VB-02",
    name: "The High Roller",
    driver: "Sofia Martinez",
    capacity: 40,
    passengers: 32,
    status: "On trip",
    lat: 36.137,
    lng: -115.164,
    destination: "Fremont Street",
    eta: 14,
    fuel: 65,
  },
  {
    id: "VB-03",
    name: "Desert Rose",
    driver: "James Wilson",
    capacity: 24,
    passengers: 0,
    status: "To pickup",
    lat: 36.099,
    lng: -115.178,
    destination: "MGM Grand",
    eta: 4,
    fuel: 82,
  },
  {
    id: "VB-04",
    name: "Neon Nights",
    driver: "Alex Rivera",
    capacity: 30,
    passengers: 0,
    status: "Available",
    lat: 36.125,
    lng: -115.19,
    destination: "Dispatch ready",
    eta: 0,
    fuel: 92,
  },
  {
    id: "VB-05",
    name: "The Afterparty",
    driver: "Daniel Kim",
    capacity: 35,
    passengers: 28,
    status: "On trip",
    lat: 36.161,
    lng: -115.146,
    destination: "The Venetian",
    eta: 18,
    fuel: 58,
  },
  {
    id: "VB-06",
    name: "Silver State",
    driver: "Taylor Brooks",
    capacity: 20,
    passengers: 0,
    status: "Available",
    lat: 36.086,
    lng: -115.152,
    destination: "Airport staging",
    eta: 0,
    fuel: 74,
  },
  {
    id: "VB-07",
    name: "Vegas Royale",
    driver: "Jordan Davis",
    capacity: 40,
    passengers: 36,
    status: "On trip",
    lat: 36.108,
    lng: -115.207,
    destination: "Allegiant Stadium",
    eta: 7,
    fuel: 61,
  },
  {
    id: "VB-08",
    name: "Electric Avenue",
    driver: "Sam Parker",
    capacity: 24,
    passengers: 0,
    status: "To pickup",
    lat: 36.145,
    lng: -115.182,
    destination: "Resorts World",
    eta: 6,
    fuel: 87,
  },
  {
    id: "VB-09",
    name: "Golden Hour",
    driver: "Casey Lee",
    capacity: 30,
    passengers: 22,
    status: "On trip",
    lat: 36.119,
    lng: -115.151,
    destination: "Sphere",
    eta: 5,
    fuel: 73,
  },
  {
    id: "VB-10",
    name: "The Oasis",
    driver: "Drew Morgan",
    capacity: 24,
    passengers: 0,
    status: "Available",
    lat: 36.171,
    lng: -115.161,
    destination: "Downtown staging",
    eta: 0,
    fuel: 95,
  },
  {
    id: "VB-11",
    name: "Starlight",
    driver: "Jamie Chen",
    capacity: 35,
    passengers: 0,
    status: "To pickup",
    lat: 36.073,
    lng: -115.174,
    destination: "Harry Reid Airport",
    eta: 9,
    fuel: 70,
  },
  {
    id: "VB-12",
    name: "Lucky Seven",
    driver: "Unassigned",
    capacity: 20,
    passengers: 0,
    status: "Offline",
    lat: 36.149,
    lng: -115.211,
    destination: "Maintenance · depot",
    eta: 0,
    fuel: 42,
  },
];
export const colors: Record<Status, string> = {
  "On trip": "#b3ed80",
  Available: "#62c9e2",
  "To pickup": "#eabe71",
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
    vehicle: "VB-01",
    status: "In progress",
  },
  {
    id: "TR-2042",
    time: "20:30",
    guest: "Reed birthday celebration",
    pickup: "MGM Grand",
    dropoff: "Fremont Street",
    passengers: 18,
    vehicle: "VB-03",
    status: "To pickup",
  },
  {
    id: "TR-2043",
    time: "20:45",
    guest: "Acme team night out",
    pickup: "Resorts World",
    dropoff: "The Venetian",
    passengers: 22,
    vehicle: "VB-08",
    status: "To pickup",
  },
  {
    id: "TR-2044",
    time: "21:00",
    guest: "Airport group transfer",
    pickup: "Harry Reid Airport",
    dropoff: "Aria Resort",
    passengers: 16,
    vehicle: "VB-11",
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
