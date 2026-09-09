import { test, expect } from "@playwright/test";
import {
  routeStats,
  completedRuns,
  shuttleFleet,
  vehicleTiming,
  inboundTo,
  atStation,
  coordinateAlong,
  progressAt,
  SESSION_START,
} from "../src/lib/shuttling";

test("directional averages include completed legs; full cycles include hotel dwell and exclude incomplete returns", () => {
  expect(routeStats("venetian")).toEqual({
    outbound: 21.5,
    return: 20.5,
    roundTrip: 49,
    dwell: 7,
    completed: 8,
  });
  expect(routeStats("virgin").roundTrip).toBe(32);
  const partial = {
    id: "partial",
    hotel: "venetian" as const,
    depart: 1100,
    hotelArrival: 1120,
    hotelDepart: 1125,
    airportReturn: null,
  };
  const result = routeStats("venetian", [...completedRuns, partial]);
  expect(result.completed).toBe(8);
  expect(result.roundTrip).toBe(49);
  expect(result.return).toBe(20.5);
});
test("delay review distinguishes travel, loading, and stale GPS; clock changes never create negative durations", () => {
  const delayed = shuttleFleet.find((v) => v.id === "VB-03")!;
  expect(vehicleTiming(delayed, SESSION_START).attention).toBe("travel");
  expect(vehicleTiming(delayed, SESSION_START, 15).attention).toBeNull();
  expect(
    vehicleTiming(
      shuttleFleet.find((v) => v.id === "VB-04")!,
      SESSION_START,
    ).attention,
  ).toBe("dwell");
  const stale = shuttleFleet.find((v) => v.id === "VB-06")!;
  expect(vehicleTiming(stale, SESSION_START).attention).toBe("stale");
  expect(progressAt(stale, SESSION_START + 10)).toBe(stale.progress);
  expect(vehicleTiming(stale, SESSION_START).eta).toBeNull();
  expect(vehicleTiming(delayed, 100).elapsed).toBe(0);
});
test("manager station distinguishes inbound and at-stop vehicles", () => {
  expect(
    shuttleFleet.filter((v) => inboundTo(v, "airport")).map((v) => v.id),
  ).toEqual(["VB-02", "VB-06", "VB-09"]);
  expect(
    shuttleFleet.filter((v) => inboundTo(v, "venetian")).map((v) => v.id),
  ).toEqual(["VB-01", "VB-03"]);
  expect(
    shuttleFleet.filter((v) => atStation(v, "airport")).map((v) => v.id),
  ).toEqual(["VB-04"]);
  expect(
    shuttleFleet.filter((v) => atStation(v, "venetian")).map((v) => v.id),
  ).toEqual(["VB-05"]);
  expect(coordinateAlong("venetian", 0)).not.toEqual(
    coordinateAlong("venetian", 1),
  );
});
test("hotel switch, stale state, thresholds, and complete-cycle averages update in the UI", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .locator(".mode-control")
    .getByRole("button", { name: "Shuttling" })
    .click();
  await page.getByRole("button", { name: "Venetian", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Inbound to Venetian", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Virgin Hotel", exact: true }).click();
  await expect(page.getByLabel("Shuttle route")).toHaveValue("virgin");
  await expect(
    page.locator(".telemetry-stat").filter({ hasText: "Round trip" }),
  ).toContainText("32");
  await page.getByRole("button", { name: "Airport", exact: true }).click();
  await page.getByLabel("Shuttle route").selectOption("venetian");
  await page.getByRole("button", { name: "View VB-06", exact: true }).click();
  await expect(page.getByLabel("Selected vehicle details")).toContainText(
    "Arrival estimate unavailable",
  );
  await expect(
    page.getByRole("button", { name: "Complete round trip", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Close vehicle details" }).click();
  await page.getByRole("button", { name: "View VB-02", exact: true }).click();
  await page
    .getByRole("button", { name: "Complete round trip", exact: true })
    .click();
  await expect(
    page.locator(".telemetry-stat").filter({ hasText: "Active vehicles" }),
  ).toContainText("9 completed cycles");
  await expect(
    page.locator(".telemetry-stat").filter({ hasText: "Round trip" }),
  ).toContainText("48.2");
});
