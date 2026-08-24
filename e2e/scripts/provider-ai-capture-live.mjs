import { chromium } from "playwright";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const FRONT = process.env.E2E_BASE_URL ?? "http://localhost:3001";
const EMAIL = process.env.E2E_PROVIDER_EMAIL;
const PASSWORD = process.env.E2E_PROVIDER_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error(
    "Set E2E_PROVIDER_EMAIL and E2E_PROVIDER_PASSWORD before running this script.",
  );
  process.exit(1);
}

const SAMPLE_TEXT =
  process.env.E2E_LISTING_TEXT ??
  "3-Zimmer-Wohnung, 2 Schlafzimmer, Freiburg, Musterstraße 12, 79098, 82 m², 1.450 € Kaltmiete, frei ab 01.09.2026";

const browser = await chromium.launch({
  headless: false,
  slowMo: 600,
});

const context = await browser.newContext({ locale: "de-DE" });
const page = await context.newPage();

console.log("Opening login...");
await page.goto(`${FRONT}/login`, { waitUntil: "networkidle" });

console.log("Signing in as provider...");
await page.locator("#login-email").fill(EMAIL);
await page.locator("#login-password").fill(PASSWORD);
await page.getByRole("button", { name: /Anmelden/i }).click();
await page.waitForURL((url) => !url.pathname.includes("/login"), {
  timeout: 15000,
});

console.log("Opening create listing page...");
await page.goto(`${FRONT}/provider/listings/new`, {
  waitUntil: "networkidle",
});

console.log("Opening AI capture...");
await page.getByRole("button", { name: /Immobilie mit KI erfassen/i }).click();

console.log("Switching to text input...");
await page.getByRole("radio", { name: /^Text$/i }).click();
await page.getByRole("textbox").fill(SAMPLE_TEXT);

console.log("Submitting extraction...");
await page.getByRole("button", { name: /Angaben erkennen/i }).click();

console.log("Waiting for extraction result...");
await page
  .getByRole("heading", { name: /Angaben erkannt/i })
  .waitFor({ state: "visible", timeout: 60000 });

console.log(
  "Done. The browser stays open until you press Enter in this terminal.",
);

const readline = createInterface({ input, output });
await readline.question("");
readline.close();

await browser.close();
