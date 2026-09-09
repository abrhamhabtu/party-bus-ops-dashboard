export const landmarks = [
  {
    id: "downtown",
    name: "Downtown Las Vegas",
    coordinates: [-115.1425, 36.1705],
    kind: "tower",
    height: 150,
    priority: 1,
  },
  {
    id: "strat",
    name: "The STRAT",
    coordinates: [-115.1555, 36.1475],
    kind: "spire",
    height: 220,
    priority: 2,
  },
  {
    id: "resorts",
    name: "Resorts World",
    coordinates: [-115.166, 36.1355],
    kind: "tower",
    height: 140,
    priority: 1,
  },
  {
    id: "fontainebleau",
    name: "Fontainebleau",
    coordinates: [-115.1598, 36.1375],
    kind: "tower",
    height: 180,
    priority: 2,
  },
  {
    id: "wynn",
    name: "Wynn / Encore",
    coordinates: [-115.1648, 36.129],
    kind: "tower",
    height: 135,
    priority: 1,
  },
  {
    id: "venetian",
    name: "The Venetian",
    coordinates: [-115.1697, 36.1212],
    kind: "tower",
    height: 120,
    priority: 0,
  },
  {
    id: "caesars",
    name: "Caesars Palace",
    coordinates: [-115.1762, 36.1162],
    kind: "tower",
    height: 90,
    priority: 2,
  },
  {
    id: "bellagio",
    name: "Bellagio",
    coordinates: [-115.1766, 36.1126],
    kind: "tower",
    height: 120,
    priority: 0,
  },
  {
    id: "aria",
    name: "ARIA",
    coordinates: [-115.1765, 36.107],
    kind: "tower",
    height: 140,
    priority: 2,
  },
  {
    id: "mgm",
    name: "MGM Grand",
    coordinates: [-115.169, 36.102],
    kind: "tower",
    height: 100,
    priority: 0,
  },
  {
    id: "luxor",
    name: "Luxor",
    coordinates: [-115.1767, 36.0955],
    kind: "pyramid",
    height: 100,
    priority: 1,
  },
  {
    id: "mandalay",
    name: "Mandalay Bay",
    coordinates: [-115.1756, 36.0916],
    kind: "tower",
    height: 140,
    priority: 2,
  },
  {
    id: "convention",
    name: "Convention Center",
    coordinates: [-115.1525, 36.131],
    kind: "low",
    height: 35,
    priority: 1,
  },
  {
    id: "airport",
    name: "LAS Airport · T1 / T3",
    coordinates: [-115.1483, 36.0851],
    kind: "airport",
    height: 0,
    priority: 0,
  },
  {
    id: "virgin",
    name: "Virgin Hotels",
    coordinates: [-115.1536, 36.1097],
    kind: "low",
    height: 35,
    priority: 2,
  },
] as const;
// Stylized landmark volumes are visual identifiers, not surveyed building models.
export function landmarkBuildings() {
  return {
    type: "FeatureCollection" as const,
    features: landmarks
      .filter((l) => l.kind !== "airport")
      .flatMap((l) =>
        [0, 1, 2].map((i) => {
          const x = l.coordinates[0] + (i - 1) * 0.00032,
            y = l.coordinates[1],
            dx = 0.00015,
            dy = 0.0003;
          return {
            type: "Feature" as const,
            properties: {
              height: l.height * (i === 1 ? 1 : 0.66),
              name: l.name,
            },
            geometry: {
              type: "Polygon" as const,
              coordinates: [
                [
                  [x - dx, y - dy],
                  [x + dx, y - dy],
                  [x + dx, y + dy],
                  [x - dx, y + dy],
                  [x - dx, y - dy],
                ],
              ],
            },
          };
        }),
      ),
  };
}
export function landmarkIcon(kind: string) {
  return kind === "airport"
    ? '<svg viewBox="0 0 40 40"><path d="M20 3v13L4 25v4l16-5v8l-5 4v2l5-2 5 2v-2l-4-4v-8l15 5v-4L21 16V3z" fill="currentColor"/></svg>'
    : kind === "pyramid"
      ? '<svg viewBox="0 0 40 45"><path d="M20 3L3 39h34zM20 3v36M3 39l17-9 17 9" fill="#55432455" stroke="currentColor" stroke-width="1.4"/><path d="M20 3V-4" stroke="#eee2b0"/></svg>'
      : kind === "spire"
        ? '<svg viewBox="0 0 35 55"><path d="M16 52l1-23-7-9h15l-6 9 1 23M9 20l8-5V1l2 14 8 5M11 24h13" stroke="currentColor" fill="#a8813644" stroke-width="1.4"/></svg>'
        : '<svg viewBox="0 0 40 48"><path d="M5 43V21l9-3V5l16-3v35l6 2v5M14 5l16-3M14 5v38M30 2v42M4 44h33" fill="#4c3b1c99" stroke="currentColor" stroke-width="1.2"/><path d="M18 9v29M23 8v29M27 7v29M6 25h7M6 30h7M6 35h7M16 14h14M16 20h14M16 26h14M16 32h14" stroke="currentColor" stroke-width=".7" opacity=".85"/></svg>';
}
