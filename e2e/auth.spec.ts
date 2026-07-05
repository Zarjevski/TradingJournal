import { test, expect } from "@playwright/test";
import { prisma } from "../src/lib/prisma";

// Each run uses a unique, timestamped throwaway email so parallel/repeat runs never collide,
// and the created user is deleted in afterAll so no test data lingers in the database.
const testEmail = `e2e-auth-${Date.now()}@example.test`;
const testPassword = "TestPassword123";

test.describe("Authentication golden paths", () => {
  test.afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
  });

  test("register creates an account, auto-logs in, and lands on the dashboard", async ({
    page,
  }) => {
    await page.goto("/auth/login");
    await page.getByText("Create account").click();

    await page.getByLabel("First Name").fill("E2E");
    await page.getByLabel("Last Name").fill("Tester");
    await page.getByLabel("Email").fill(testEmail);
    await page.getByLabel("Password").fill(testPassword);

    await page.getByRole("button", { name: /sign up/i }).click();

    await page.waitForURL("/dashboard", { timeout: 15_000 });
    await expect(page.getByText("Trading Command Center")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("login with the registered credentials reaches the dashboard", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel("Email").fill(testEmail);
    await page.getByLabel("Password").fill(testPassword);
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.waitForURL("/dashboard", { timeout: 15_000 });
  });

  test("logout returns the user to a signed-out state", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel("Email").fill(testEmail);
    await page.getByLabel("Password").fill(testPassword);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL("/dashboard", { timeout: 15_000 });

    await page.getByRole("button", { name: /log ?out/i }).click();

    await page.waitForURL(/\/auth\/login/, { timeout: 15_000 });
  });

  test("visiting a protected route while signed out redirects to login", async ({ page }) => {
    await page.goto("/trades");
    await page.waitForURL(/\/auth\/login/, { timeout: 15_000 });
  });

  test("visiting a protected /dashboard route while signed out redirects to login", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/auth\/login/, { timeout: 15_000 });
  });

  test("the marketing home page is reachable without signing in", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("link", { name: /go to dashboard/i }).first()).toBeVisible();
  });
});
