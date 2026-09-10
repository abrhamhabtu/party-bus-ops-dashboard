import { chromium } from "@playwright/test";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 950 },
  deviceScaleFactor: 1,
});
await page.goto(process.env.PREVIEW_URL || "http://127.0.0.1:5173/");
await page.locator('[data-map-ready="true"]').waitFor({ timeout: 30000 });
await page.waitForTimeout(3000);
const canvas = page.locator(".map-renderer canvas").first();
const box = await canvas.boundingBox();
const cx = box.x + box.width * 0.42;
const cy = box.y + box.height * 0.45;
const steps = Number(process.env.ZOOM_STEPS || 9);
for (let i = 0; i < steps; i++) {
  await page.mouse.move(cx, cy);
  await page.mouse.wheel(0, -220);
  await page.waitForTimeout(120);
}
await page.waitForTimeout(900);
await page.screenshot({
  path: process.env.SHOT || "docs/landmark-vehicle-detail.png",
});
await browser.close();
