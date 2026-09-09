import { test, expect } from "@playwright/test";
test("command views, search, landmark settings and connection readiness", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator('[data-map-ready="true"]')).toBeVisible({
    timeout: 30000,
  });
  await page.locator(".header-search input").fill("Buffalo");
  await expect(page.locator(".fleet-mini")).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "View Buffalo", exact: true }),
  ).toBeVisible();
  await page.locator(".header-search input").fill("");
  await page.getByRole("button", { name: "Map layers", exact: true }).click();
  await page.getByLabel("Vegas landmarks").uncheck();
  await expect(page.locator(".landmark-marker").first()).toBeHidden();
  await page.getByLabel("Vegas landmarks").check();
  await expect(page.locator(".landmark-marker").first()).toBeVisible();
  await page.getByRole("button", { name: "Map layers", exact: true }).click();
  await page.getByRole("button", { name: "Focus The Venetian", exact: true }).click();
  await page.getByRole("button", { name: "Fleet", exact: true }).click();
  await page.getByLabel("Search fleet directory").fill("Buffalo");
  await expect(page.locator(".directory-grid article")).toHaveCount(1);
  await page.getByRole("button", { name: "Cameras", exact: true }).click();
  await expect(page.getByText("No camera connected")).toHaveCount(2);
  await page.getByRole("button", { name: "Maintenance", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Maintenance holds" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reports", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Daily operations report" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Integrations", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Verify read-only API access" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("heading", { name: "Connection diagnostics" }),
  ).toBeVisible();
});
test("phone navigation reaches all workspaces without horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  for (const name of [
    "Fleet",
    "Cameras",
    "Maintenance",
    "Reports",
    "Integrations",
    "Drivers",
    "Dispatch",
    "Overview",
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test('demo scenes remain interactive when Verizon is unavailable', async ({page}) => {
  await page.route('**/api/verizon/**', route => route.fulfill({status:503,contentType:'application/json',body:'{"message":"Provider unavailable"}'}));
  await page.goto('/');
  await expect(page.locator('[data-map-ready="true"]')).toBeVisible({timeout:30000});
  await page.getByLabel('Load demo scene').selectOption('day');
  await expect(page.getByRole('button',{name:'Pause simulation'})).toBeVisible();
  await expect(page.locator('.map-renderer')).toHaveAttribute('data-camera','valley');
  await page.getByRole('button',{name:'Pause simulation'}).click();
  await page.getByLabel('Load demo scene').selectOption('airport');
  await expect(page.locator('.map-renderer')).toHaveAttribute('data-camera','shuttle');
  await expect(page.getByRole('button',{name:'Pause simulation'})).toBeVisible();
  await page.getByLabel('Load demo scene').selectOption('review');
  await expect(page.getByRole('button',{name:'Play simulation'})).toBeVisible();
  await expect(page.getByLabel('Selected vehicle details')).toContainText('Bankroll');
  await page.getByRole('button',{name:'Reset example shift'}).click();
  await expect(page.getByLabel('Simulation time')).toHaveValue('1218');
  await page.setViewportSize({width:390,height:844});
  await page.getByLabel('Load demo scene').selectOption('night');
  await expect(page.getByRole('button',{name:'Pause simulation'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
