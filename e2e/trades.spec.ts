import { test, expect } from "@playwright/test";
import { prisma } from "../src/lib/prisma";
import bcrypt from "bcrypt";

// Seeds a throwaway user + exchange directly via Prisma (skipping the CoinGecko-backed "add
// exchange" UI flow, which would make this test dependent on a third-party API) so the test
// focuses on the actual feature under test: creating a trade through the UI and seeing it
// reflected in the trades table and calendar. Everything created here is deleted in afterAll.
const testEmail = `e2e-trades-${Date.now()}@example.test`;
const testPassword = "TestPassword123";
let userId: string;

test.describe("Trade creation golden path", () => {
  test.beforeAll(async () => {
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        password: hashedPassword,
        firstName: "E2E",
        lastName: "Trader",
      },
    });
    userId = user.id;

    await prisma.exchange.create({
      data: {
        traderID: userId,
        exchangeName: "Binance",
        // A data URI (not a remote CoinGecko URL) so this fixture never depends on a
        // third-party CDN being reachable — next/image renders data URIs unoptimized,
        // with no outbound fetch at all. It's a 1x1 transparent PNG; the test doesn't
        // care what the logo looks like, only that the exchange card is clickable.
        image:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
        balance: 1000,
      },
    });
  });

  test.afterAll(async () => {
    await prisma.trade.deleteMany({ where: { traderID: userId } });
    await prisma.exchange.deleteMany({ where: { traderID: userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  });

  test("add a trade via the UI, then see it in the trades table and on the calendar", async ({
    page,
  }) => {
    await page.goto("/auth/login");
    await page.getByLabel("Email").fill(testEmail);
    await page.getByLabel("Password").fill(testPassword);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL("/dashboard", { timeout: 15_000 });

    await page.goto("/trades");
    await page.getByRole("button", { name: "Add Trade" }).click();

    // Step 1: choose the seeded exchange. Scoped to a heading (ExchangeCard renders <h2>) so
    // this doesn't collide with the trades-page filter dropdown's <option>Binance</option>,
    // which shares the same text but isn't a heading and isn't interactable while closed.
    await page.getByRole("heading", { name: "Binance", level: 2 }).click();
    await page.getByRole("button", { name: "continue" }).click();

    // Step 2: fill in trade details. SearchableSelect's "Select cryptocurrency..." placeholder
    // is plain text inside a <span>, not a real HTML placeholder attribute, so it needs a text
    // locator rather than getByPlaceholder.
    await page.getByRole("button", { name: "Select cryptocurrency..." }).click();
    await page.getByPlaceholder("Search...").fill("BTC");
    await page.getByText("Bitcoin", { exact: true }).first().click();

    await page.getByRole("button", { name: "Long" }).click();
    await page.getByLabel("size").fill("100");
    await page.getByRole("button", { name: "Win" }).click();

    const today = new Date().toISOString().slice(0, 10);
    await page.getByLabel("entry date").fill(today);
    await page.getByLabel("result (P/L)").fill("50");
    await page.getByPlaceholder("Trade Summary / Reason").fill("E2E test trade");

    await page.getByRole("button", { name: "Create Trade" }).click();

    // Success is signaled via the browser's native Notification API (not an in-page DOM
    // toast), so it isn't something Playwright can assert on via the page's DOM. The modal
    // closing is the reliable in-DOM signal that the POST succeeded.
    await expect(page.getByRole("heading", { name: "Add New Trade" })).not.toBeVisible({
      timeout: 10_000,
    });

    // TradesClient's table is populated from server-rendered initial props + its own
    // filter-triggered fetches — it has no live-subscription to the global "add trade"
    // modal, so a newly created trade doesn't appear until the page re-fetches. Reload to
    // match what a real user would see after navigating back to this page.
    await page.reload();
    await expect(page.getByRole("cell", { name: "BTC" })).toBeVisible({ timeout: 10_000 });

    // Verify it shows in the trades page's Calendar view with the correct net P&L for the
    // day. "+$50" appears both in the monthly summary card and the day cell, so scope to the
    // day cell button.
    await page.getByRole("button", { name: "Calendar" }).click();
    await expect(page.getByRole("button", { name: "+$50 1 trade" })).toBeVisible({
      timeout: 10_000,
    });
  });
});
