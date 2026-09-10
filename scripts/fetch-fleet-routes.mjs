// One-off generator: fetches real driving-route geometry for every unique
// (from, to) place pair used by the valley-wide fleet legs in src/lib/data.ts,
// and caches it to src/lib/map/fleet-routes.json. Not run at build or runtime.
import { writeFile } from "node:fs/promises";

const places = {
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
};

const pairs = [
  ["Centennial Hills", "Harry Reid · T1"],
  ["Centennial Hills", "Henderson"],
  ["Centennial Hills", "The Strip · Bellagio"],
  ["Centennial Hills", "The Strip · Venetian"],
  ["Chinatown", "Mountain's Edge"],
  ["Chinatown", "Summerlin"],
  ["Chinatown", "The Strip · Resorts World"],
  ["Harry Reid · T1", "Summerlin"],
  ["Harry Reid · T1", "The Strip · MGM"],
  ["Harry Reid · T1", "The Strip · Resorts World"],
  ["Harry Reid · T1", "The Strip · Venetian"],
  ["Harry Reid · T3", "Chinatown"],
  ["Harry Reid · T3", "The Strip · Bellagio"],
  ["Harry Reid · T3", "The Strip · Venetian"],
  ["Harry Reid · T3", "The Strip · Wynn"],
  ["Henderson", "Harry Reid · T3"],
  ["Henderson", "Spring Valley"],
  ["Henderson", "The Strip · Bellagio"],
  ["Henderson", "The Strip · MGM"],
  ["Henderson", "The Strip · Wynn"],
  ["Mountain's Edge", "Harry Reid · T1"],
  ["Mountain's Edge", "The Strip · Wynn"],
  ["North Las Vegas", "Harry Reid · T1"],
  ["North Las Vegas", "Henderson"],
  ["North Las Vegas", "The Strip · Venetian"],
  ["Southern Highlands", "Harry Reid · T1"],
  ["Southern Highlands", "Spring Valley"],
  ["Southern Highlands", "The Strip · MGM"],
  ["Spring Valley", "Harry Reid · T3"],
  ["Spring Valley", "Southern Highlands"],
  ["Spring Valley", "The Strip · Bellagio"],
  ["Spring Valley", "The Strip · Venetian"],
  ["Summerlin", "Chinatown"],
  ["Summerlin", "Harry Reid · T1"],
  ["Summerlin", "Harry Reid · T3"],
  ["Summerlin", "The Strip · Venetian"],
  ["The Strip · Bellagio", "Chinatown"],
  ["The Strip · Bellagio", "Downtown"],
  ["The Strip · Bellagio", "Harry Reid · T3"],
  ["The Strip · Bellagio", "The Strip · MGM"],
  ["The Strip · Bellagio", "The Strip · Venetian"],
  ["The Strip · Bellagio", "The Strip · Wynn"],
  ["The Strip · MGM", "Centennial Hills"],
  ["The Strip · MGM", "Downtown"],
  ["The Strip · MGM", "The Strip · Bellagio"],
  ["The Strip · MGM", "The Strip · Wynn"],
  ["The Strip · Resorts World", "Centennial Hills"],
  ["The Strip · Resorts World", "Downtown"],
  ["The Strip · Resorts World", "Henderson"],
  ["The Strip · Resorts World", "The Strip · Bellagio"],
  ["The Strip · Resorts World", "The Strip · Wynn"],
  ["The Strip · Venetian", "Downtown"],
  ["The Strip · Venetian", "Harry Reid · T1"],
  ["The Strip · Venetian", "Henderson"],
  ["The Strip · Venetian", "North Las Vegas"],
  ["The Strip · Venetian", "Spring Valley"],
  ["The Strip · Venetian", "The Strip · Bellagio"],
  ["The Strip · Venetian", "The Strip · MGM"],
  ["The Strip · Venetian", "The Strip · Resorts World"],
  ["The Strip · Venetian", "The Strip · Wynn"],
  ["The Strip · Wynn", "Centennial Hills"],
  ["The Strip · Wynn", "Downtown"],
  ["The Strip · Wynn", "Southern Highlands"],
  ["The Strip · Wynn", "The Strip · Bellagio"],
  ["The Strip · Wynn", "The Strip · Resorts World"],
  ["The Strip · Wynn", "The Strip · Venetian"],
];

async function fetchRoute(from, to) {
  const a = places[from],
    b = places[to];
  const url = `https://router.project-osrm.org/route/v1/driving/${a[0]},${a[1]};${b[0]},${b[1]}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${from} -> ${to}`);
  const data = await res.json();
  const coords = data?.routes?.[0]?.geometry?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2)
    throw new Error(`No geometry for ${from} -> ${to}`);
  return coords;
}

const out = {};
let failed = 0;
for (const [from, to] of pairs) {
  const key = `${from}|${to}`;
  try {
    out[key] = await fetchRoute(from, to);
    console.log(`ok   ${key} (${out[key].length} pts)`);
  } catch (err) {
    failed++;
    console.error(`fail ${key}: ${err.message}`);
  }
  await new Promise((r) => setTimeout(r, 250));
}

await writeFile(
  new URL("../src/lib/map/fleet-routes.json", import.meta.url),
  JSON.stringify(out),
);
console.log(
  `Wrote ${Object.keys(out).length}/${pairs.length} routes (${failed} failed) to src/lib/map/fleet-routes.json`,
);
