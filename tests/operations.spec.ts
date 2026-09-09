import { test, expect } from "@playwright/test";
test("dispatch validates capacity, saves a trip, persists, and completes it", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "New trip", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Group or guest name" })
    .fill("Test celebration");
  await page.getByLabel("Pickup", { exact: true }).fill("Bellagio");
  await page.getByLabel("Destination", { exact: true }).fill("Sphere");
  await page.getByRole("spinbutton", { name: "Passengers" }).fill("41");
  await page.getByRole("button", { name: "Create trip", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("seats 40");
  await page.getByRole("spinbutton", { name: "Passengers" }).fill("24");
  await page.getByRole("button", { name: "Create trip", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Test celebration" }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Dispatch", exact: true }).click();
  const trip = page
    .locator(".trip-card")
    .filter({ hasText: "Test celebration" });
  await trip.getByRole("button", { name: "Start trip" }).click();
  await expect(trip).toContainText("In progress");
  await trip.getByRole("button", { name: "Complete trip" }).click();
  await expect(trip).toContainText("Completed");
});
test("fleet map fills the canvas so vehicles stay visible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.locator('[data-map-ready="true"]')).toBeVisible({
    timeout: 30000,
  });
  const sizes = await page.evaluate(() => {
    const map = document.querySelector(".vector-map");
    const renderer = document.querySelector(".map-renderer");
    const marker = document.querySelector(".map-bus");
    return {
      mapH: map?.getBoundingClientRect().height ?? 0,
      rendererH: renderer?.getBoundingClientRect().height ?? 0,
      markerH: marker?.getBoundingClientRect().height ?? 0,
      markerVisible: marker
        ? getComputedStyle(marker).visibility === "visible" &&
          getComputedStyle(marker).opacity !== "0"
        : false,
    };
  });
  expect(sizes.rendererH).toBeGreaterThan(400);
  expect(sizes.mapH).toBeGreaterThan(400);
  expect(Math.abs(sizes.mapH - sizes.rendererH)).toBeLessThanOrEqual(2);
  expect(sizes.markerH).toBeGreaterThan(20);
  expect(sizes.markerVisible).toBeTruthy();
  const hasBusBody = await page.evaluate(
    () => !!document.querySelector(".map-bus svg"),
  );
  expect(hasBusBody).toBeTruthy();
  const slider = page.getByLabel("Simulation time");
  await expect(slider).toHaveAttribute("max", "1439");
  await expect(slider).toHaveAttribute("min", "0");
  await expect(
    page.getByRole("button", { name: /Locate Max Bet/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Locate Side Bet/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Locate Bankroll/ }),
  ).toBeVisible();
});
test("3D map controls, filtering and shuttle boarding work", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator('[data-map-ready="true"]')).toBeVisible({
    timeout: 30000,
  });
  await page.getByRole("button", { name: "Switch to 2D map" }).click();
  await expect(page.locator(".map-renderer")).toHaveAttribute(
    "data-perspective",
    "2d",
  );
  await page.getByRole("button", { name: "Switch to 3D map" }).click();
  await page
    .getByRole("textbox", { name: "Search vehicles" })
    .fill("Let It Ride");
  await expect(page.locator(".fleet-mini")).toHaveCount(1);
  await page.getByRole("button", { name: "View Let It Ride", exact: true }).click();
  await expect(page.getByLabel("Selected vehicle details")).toContainText(
    "Alex Rivera",
  );
  await page
    .locator(".mode-control")
    .getByRole("button", { name: "Shuttling", exact: true })
    .click();
  await page.getByRole("button", { name: "View Let It Ride", exact: true }).click();
  await page
    .getByRole("button", { name: "Add passenger", exact: true })
    .click();
  await expect(page.locator(".boarding-control")).toContainText("19 / 38");
  await page
    .getByRole("button", { name: "Depart T1 ground", exact: true })
    .click();
  await expect(page.locator(".inspector-status")).toContainText("To Venetian");
});
test("demo replay advances the clock and moves a mapped vehicle", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator('[data-map-ready="true"]')).toBeVisible({
    timeout: 30000,
  });
  const before = await page.evaluate(() => {
    const marker = document.querySelector('[aria-label^="Locate Buffalo"]');
    const box = marker?.getBoundingClientRect();
    return {
      clock: (
        document.querySelector('[aria-label="Simulation time"]') as HTMLInputElement
      ).value,
      left: box?.left ?? 0,
    };
  });
  await page.getByRole("button", { name: "Play simulation" }).click();
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          (
            document.querySelector(
              '[aria-label="Simulation time"]',
            ) as HTMLInputElement
          ).value,
      ),
    )
    .not.toBe(before.clock);
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const marker = document.querySelector('[aria-label^="Locate Buffalo"]');
        return marker?.getBoundingClientRect().left ?? 0;
      }),
    )
    .not.toBe(before.left);
});
test("driver ends demo shift and automatic expiry is enforced", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  await page.getByRole("button", { name: "Drivers", exact: true }).click();
  await page.getByRole("button", { name: "Start demo shift" }).click();
  await expect(page.getByText("On shift · demo tracking active")).toBeVisible();
  await page.clock.fastForward(8 * 60 * 60 * 1000 + 5000);
  await expect(page.getByText("Off shift · tracking is off")).toBeVisible();
});
test("fleet night view uses the Strip-Fremont corridor; shuttling stays tight", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator('[data-map-ready="true"]')).toBeVisible({
    timeout: 30000,
  });
  await expect(page.locator(".map-renderer")).toHaveAttribute(
    "data-camera",
    "night-corridor",
  );
  await expect(page.getByText("Strip & downtown corridor")).toBeVisible();
  await page.getByLabel("Simulation time").fill("720");
  await expect(page.locator(".map-renderer")).toHaveAttribute(
    "data-camera",
    "valley",
  );
  await page
    .locator(".mode-control")
    .getByRole("button", { name: "Shuttling", exact: true })
    .click();
  await expect(page.locator(".map-renderer")).toHaveAttribute(
    "data-camera",
    "shuttle",
  );
  await expect(page.getByRole("heading", { name: "Shuttling" })).toBeVisible();
});
test("mobile shuttle chrome stays off the map so vehicles stay visible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator('[data-map-ready="true"]')).toBeVisible({
    timeout: 30000,
  });
  await page
    .locator(".mode-control")
    .getByRole("button", { name: "Shuttling", exact: true })
    .click();
  await expect(page.locator(".map-renderer")).toHaveAttribute(
    "data-camera",
    "shuttle",
  );
  await expect(page.locator(".map-legend-compact")).toBeHidden();
  await expect(page.locator(".geographic-title")).toBeHidden();
  await expect(page.locator(".region-select")).toBeHidden();
  await expect(
    page.getByRole("button", { name: /Locate Buffalo/ }),
  ).toBeVisible();
  const covered = await page.evaluate(() => {
    const map = document.querySelector(".vector-map")!.getBoundingClientRect();
    const marker = document
      .querySelector(".map-bus")!
      .getBoundingClientRect();
    const blockers = [
      ...document.querySelectorAll(
        ".map-legend-compact, .geographic-title, .region-select",
      ),
    ].filter((el) => getComputedStyle(el).display !== "none");
    return {
      markerInMap:
        marker.top >= map.top &&
        marker.bottom <= map.bottom &&
        marker.left >= map.left &&
        marker.right <= map.right,
      hasSvg: !!document.querySelector(".map-bus svg"),
      blockerCount: blockers.length,
    };
  });
  expect(covered.hasSvg).toBeTruthy();
  expect(covered.markerInMap).toBeTruthy();
  expect(covered.blockerCount).toBe(0);
});
test("desktop and mobile render without page errors or horizontal overflow", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator('[data-map-ready="true"]')).toBeVisible({
    timeout: 30000,
  });
  await page.setViewportSize({ width: 1440, height: 1050 });
  await page.screenshot({ path: "docs/desktop-preview.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "docs/mobile-preview.png", fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  expect(errors).toEqual([]);
});
