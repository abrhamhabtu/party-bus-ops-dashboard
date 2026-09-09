import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 950 },
  deviceScaleFactor: 1,
});
page.on("pageerror", (e) => console.log("PAGE ERROR:", e.message));
page.on("console", (m) => {
  if (m.type() === "error") console.log("CONSOLE:", m.text().slice(0, 300));
});
await page.goto(process.env.PREVIEW_URL || "http://127.0.0.1:5173/");
await page.locator('[data-map-ready="true"]').waitFor({ timeout: 30000 });
await page.waitForTimeout(4500);
await page.screenshot({ path: "docs/desktop-preview.png" });
await page
  .locator(".mode-control")
  .getByRole("button", { name: "Shuttling" })
  .click();
await page.screenshot({ path: "docs/shuttling-preview.png" });
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(1000);
await page.screenshot({ path: "docs/mobile-preview.png", fullPage: true });
console.log(
  "overflow",
  await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
);
await browser.close();
