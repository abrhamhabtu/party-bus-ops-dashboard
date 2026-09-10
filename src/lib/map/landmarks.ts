export const landmarks = [
  {
    id: "downtown",
    name: "Downtown Las Vegas",
    coordinates: [-115.1425, 36.1705],
    kind: "tower",
    shape: "cluster",
    color: "#8f7a4e",
    height: 150,
    priority: 1,
  },
  {
    id: "strat",
    name: "The STRAT",
    coordinates: [-115.1555, 36.1475],
    kind: "spire",
    shape: "needle",
    color: "#b39a68",
    height: 220,
    priority: 2,
  },
  {
    id: "resorts",
    name: "Resorts World",
    coordinates: [-115.166, 36.1355],
    kind: "tower",
    shape: "twin",
    color: "#6d8398",
    height: 140,
    priority: 1,
  },
  {
    id: "fontainebleau",
    name: "Fontainebleau",
    coordinates: [-115.1598, 36.1375],
    kind: "tower",
    shape: "single",
    color: "#2f4a63",
    height: 180,
    priority: 2,
  },
  {
    id: "wynn",
    name: "Wynn / Encore",
    coordinates: [-115.1648, 36.129],
    kind: "tower",
    shape: "twin",
    color: "#8a5a37",
    height: 135,
    priority: 1,
  },
  {
    id: "venetian",
    name: "The Venetian",
    coordinates: [-115.1697, 36.1212],
    kind: "tower",
    shape: "campanile",
    color: "#a8845c",
    height: 120,
    priority: 0,
  },
  {
    id: "caesars",
    name: "Caesars Palace",
    coordinates: [-115.1762, 36.1162],
    kind: "tower",
    shape: "low-wide",
    color: "#9a9585",
    height: 90,
    priority: 2,
  },
  {
    id: "bellagio",
    name: "Bellagio",
    coordinates: [-115.1766, 36.1126],
    kind: "tower",
    shape: "curved",
    color: "#a8a294",
    height: 120,
    priority: 0,
  },
  {
    id: "aria",
    name: "ARIA",
    coordinates: [-115.1765, 36.107],
    kind: "tower",
    shape: "curved",
    color: "#4a7a74",
    height: 140,
    priority: 2,
  },
  {
    id: "mgm",
    name: "MGM Grand",
    coordinates: [-115.169, 36.102],
    kind: "tower",
    shape: "single",
    color: "#3d7a4c",
    height: 100,
    priority: 0,
  },
  {
    id: "luxor",
    name: "Luxor",
    coordinates: [-115.1767, 36.0955],
    kind: "pyramid",
    shape: "pyramid",
    color: "#171a1e",
    height: 100,
    priority: 1,
  },
  {
    id: "mandalay",
    name: "Mandalay Bay",
    coordinates: [-115.1756, 36.0916],
    kind: "tower",
    shape: "curved",
    color: "#8a7040",
    height: 140,
    priority: 2,
  },
  {
    id: "convention",
    name: "Convention Center",
    coordinates: [-115.1525, 36.131],
    kind: "low",
    shape: "low-wide",
    color: "#4a5560",
    height: 35,
    priority: 1,
  },
  {
    id: "airport",
    name: "LAS Airport · T1 / T3",
    coordinates: [-115.1483, 36.0851],
    kind: "airport",
    shape: "none",
    color: "#8c9db5",
    height: 0,
    priority: 0,
  },
  {
    id: "virgin",
    name: "Virgin Hotels",
    coordinates: [-115.1536, 36.1097],
    kind: "low",
    shape: "single",
    color: "#7a3f4a",
    height: 35,
    priority: 2,
  },
] as const;
// Stylized landmark volumes are visual identifiers, not surveyed building models —
// each shape approximates the real building's silhouette (twin towers, a curved
// glass slab, a campanile-and-podium, a low sprawling colonnade) rather than the
// single shared gold box every landmark used before. Footprints are written in
// metres so the masses stay in believable proportion to their height instead of
// rendering as toothpicks.
const M_PER_DEG_LAT = 111320;
const M_PER_DEG_LNG = 111320 * Math.cos((36.11 * Math.PI) / 180);
const eastMetres = (m: number) => m / M_PER_DEG_LNG;
const northMetres = (m: number) => m / M_PER_DEG_LAT;
function box(
  cx: number,
  cy: number,
  dx: number,
  dy: number,
  height: number,
  color: string,
  name: string,
) {
  return {
    type: "Feature" as const,
    properties: { height, color, name },
    geometry: {
      type: "Polygon" as const,
      coordinates: [
        [
          [cx - dx, cy - dy],
          [cx + dx, cy - dy],
          [cx + dx, cy + dy],
          [cx - dx, cy + dy],
          [cx - dx, cy - dy],
        ],
      ],
    },
  };
}
function octagon(
  cx: number,
  cy: number,
  dx: number,
  dy: number,
  height: number,
  color: string,
  name: string,
) {
  const cut = 0.4;
  return {
    type: "Feature" as const,
    properties: { height, color, name },
    geometry: {
      type: "Polygon" as const,
      coordinates: [
        [
          [cx - dx * cut, cy - dy],
          [cx + dx * cut, cy - dy],
          [cx + dx, cy - dy * cut],
          [cx + dx, cy + dy * cut],
          [cx + dx * cut, cy + dy],
          [cx - dx * cut, cy + dy],
          [cx - dx, cy + dy * cut],
          [cx - dx, cy - dy * cut],
          [cx - dx * cut, cy - dy],
        ],
      ],
    },
  };
}
export function landmarkBuildings() {
  return {
    type: "FeatureCollection" as const,
    features: landmarks
      .filter((l) => l.shape !== "none" && l.shape !== "pyramid")
      .flatMap((l) => {
        const [x, y] = l.coordinates;
        const { height, color, name, shape } = l;
        switch (shape) {
          // Two slender towers side by side (Wynn/Encore, Resorts World).
          case "twin":
            return [
              box(
                x - eastMetres(62),
                y,
                eastMetres(52),
                northMetres(26),
                height,
                color,
                name,
              ),
              box(
                x + eastMetres(62),
                y,
                eastMetres(52),
                northMetres(26),
                height * 0.9,
                color,
                name,
              ),
            ];
          // One broad slab (MGM Grand, Fontainebleau, Virgin).
          case "single":
            return [
              box(
                x,
                y,
                eastMetres(85),
                northMetres(43),
                height,
                color,
                name,
              ),
            ];
          // Rounded glass sweep (Bellagio, ARIA, Mandalay Bay).
          case "curved":
            return [
              octagon(
                x,
                y,
                eastMetres(95),
                northMetres(36),
                height,
                color,
                name,
              ),
            ];
          // Slender bell tower over a sprawling podium (The Venetian).
          case "campanile":
            return [
              box(
                x,
                y,
                eastMetres(14),
                northMetres(14),
                height,
                color,
                name,
              ),
              box(
                x,
                y + northMetres(70),
                eastMetres(105),
                northMetres(62),
                height * 0.26,
                color,
                name,
              ),
            ];
          // Low sprawling complex (Caesars, Convention Center).
          case "low-wide":
            return [
              box(
                x,
                y,
                eastMetres(165),
                northMetres(95),
                height,
                color,
                name,
              ),
            ];
          // The STRAT: a genuinely thin spike.
          case "needle":
            return [
              box(x, y, eastMetres(13), northMetres(13), height, color, name),
            ];
          // Downtown reads as a small huddle of towers.
          case "cluster":
          default:
            return [0, 1, 2].map((i) =>
              box(
                x + eastMetres((i - 1) * 95),
                y + northMetres(i === 1 ? 0 : 30),
                eastMetres(36),
                northMetres(36),
                height * (i === 1 ? 1 : 0.62),
                color,
                name,
              ),
            );
        }
      }),
  };
}
export function landmarkIcon(kind: string, shape: string) {
  // The extruded masses carry the identity now, so the label only needs a small
  // anchor dot rather than a competing line drawing.
  if (kind === "airport")
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.4v7.2l8.4 4.8v2.4l-8.4-3v4.8l2.7 2.1v1.5L12 21l-2.7 1.2v-1.5l2.7-2.1v-4.8l-8.4 3v-2.4L12 9.6V2.4Z" fill="currentColor"/></svg>';
  if (shape === "pyramid")
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5.5 19 18H5Z" fill="currentColor" opacity=".9"/></svg>';
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="currentColor"/><circle cx="12" cy="12" r="7.4" fill="none" stroke="currentColor" stroke-width="1.3" opacity=".45"/></svg>';
}
