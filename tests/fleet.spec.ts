import { test, expect } from "@playwright/test";
import {
  fleet,
  fleetCoordinate,
  fleetSnapshot,
  FLEET_DAY_MINUTES,
  places,
} from "../src/lib/data";
import { spreadOverlappingLabels } from "../src/lib/labels";
import {
  DAY_VALLEY_CAMERA,
  NIGHT_CORRIDOR_CAMERA,
  SHUTTLE_CAMERA,
  fleetCamera,
  isNightOps,
  viewCamera,
} from "../src/lib/map/cameras";

const dist = (a: [number, number], b: [number, number]) =>
  Math.hypot(a[0] - b[0], a[1] - b[1]);

test("each bus has a unique color", () => {
  expect(new Set(fleet.map((v) => v.color)).size).toBe(fleet.length);
});

test("midday buses are spread across the valley, not stacked on the Strip", () => {
  const noon = fleet
    .filter((v) => v.name !== "Executive 3")
    .map((v) => fleetCoordinate(v, 12 * 60));
  let max = 0;
  for (let i = 0; i < noon.length; i++) {
    for (let j = i + 1; j < noon.length; j++) {
      max = Math.max(max, dist(noon[i], noon[j]));
    }
  }
  expect(max).toBeGreaterThan(0.18);
  const neighborhoods = fleet
    .filter((v) => v.name !== "Executive 3")
    .map((v) => fleetSnapshot(v, 12 * 60).area);
  expect(neighborhoods.some((a) => /Henderson|Centennial|North Las Vegas|Southern Highlands|Mountain|Spring Valley/i.test(a))).toBe(
    true,
  );
});

test("nighttime work shifts onto hotel and Strip trips", () => {
  const strip = [-115.172, 36.118] as [number, number];
  const active = fleet.filter((v) => v.name !== "Executive 3");
  const nearStrip = active.filter(
    (v) => dist(fleetCoordinate(v, 21 * 60 + 30), strip) < 0.09,
  );
  expect(nearStrip.length).toBeGreaterThanOrEqual(6);
  expect(
    active.some((v) =>
      /Strip|Venetian|Bellagio|Wynn|MGM|hotel/i.test(
        fleetSnapshot(v, 21 * 60 + 30).destination,
      ),
    ),
  ).toBe(true);
});

test("a 24-hour day has morning suburb runs and later Strip hops", () => {
  const buffalo = fleet.find((v) => v.name === "Buffalo")!;
  const morning = fleetSnapshot(buffalo, 7 * 60 + 15);
  const night = fleetSnapshot(buffalo, 22 * 60);
  expect(morning.area).toMatch(
    /Centennial|Henderson|North Las Vegas|Spring Valley|Southern Highlands|Mountain/i,
  );
  expect(night.destination).toMatch(/Strip|Venetian|Bellagio|Wynn|MGM|Fremont/i);
  expect(fleetCoordinate(buffalo, 8 * 60)).not.toEqual(
    fleetCoordinate(buffalo, 22 * 60),
  );
  expect(FLEET_DAY_MINUTES).toBe(24 * 60);
});

test("overlapping map labels fan out so names stay readable", () => {
  const offsets = spreadOverlappingLabels([
    { id: "a", x: 100, y: 100 },
    { id: "b", x: 102, y: 101 },
    { id: "c", x: 101, y: 99 },
    { id: "d", x: 400, y: 400 },
  ]);
  const pair = dist(
    [offsets.a.dx, offsets.a.dy],
    [offsets.b.dx, offsets.b.dy],
  );
  expect(pair).toBeGreaterThan(20);
  expect(offsets.d.dx).toBe(0);
  expect(offsets.d.dy).toBe(0);
});

test("buses parked in the same neighborhood are offset, not stacked", () => {
  const downtown = [...places.Downtown] as [number, number];
  const parked = fleet
    .filter((v) => v.name !== "Executive 3")
    .map((v) => fleetCoordinate(v, 23 * 60 + 40))
    .filter((c) => dist(c, downtown) < 0.02);
  expect(parked.length).toBeGreaterThan(2);
  let closest = Infinity;
  for (let i = 0; i < parked.length; i++) {
    for (let j = i + 1; j < parked.length; j++) {
      closest = Math.min(closest, dist(parked[i], parked[j]));
    }
  }
  expect(closest).toBeGreaterThan(0.001);
});

test("shuttle camera stays tight on the airport-strip loop", () => {
  expect(SHUTTLE_CAMERA.zoom).toBeGreaterThan(12.4);
  expect(dist(SHUTTLE_CAMERA.center, places["Harry Reid · T1"] as [number, number])).toBeLessThan(0.05);
  expect(viewCamera(true, 12 * 60, true).zoom).toBe(SHUTTLE_CAMERA.zoom);
});

test("busy-night fleet camera looks up the Strip toward downtown and Fremont", () => {
  expect(isNightOps(20 * 60 + 18)).toBe(true);
  expect(NIGHT_CORRIDOR_CAMERA.zoom).toBeGreaterThan(12);
  expect(NIGHT_CORRIDOR_CAMERA.zoom).toBeLessThan(SHUTTLE_CAMERA.zoom);
  expect(NIGHT_CORRIDOR_CAMERA.center[1]).toBeGreaterThan(SHUTTLE_CAMERA.center[1]);
  expect(NIGHT_CORRIDOR_CAMERA.pitch).toBeGreaterThan(52);
  const night = fleetCamera(21 * 60, true);
  expect(night.zoom).toBe(NIGHT_CORRIDOR_CAMERA.zoom);
  expect(dist(night.center, places.Downtown as [number, number])).toBeLessThan(0.08);
});

test("daytime fleet camera pulls back; shuttle never uses the valley frame", () => {
  const day = fleetCamera(12 * 60, true);
  const night = fleetCamera(21 * 60, true);
  expect(day.zoom).toBe(DAY_VALLEY_CAMERA.zoom);
  expect(day.zoom).toBeLessThan(night.zoom);
  expect(viewCamera(true, 21 * 60, true).zoom).toBe(SHUTTLE_CAMERA.zoom);
  expect(viewCamera(false, 21 * 60, false).pitch).toBe(0);
});
