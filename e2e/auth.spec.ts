import { test, expect } from "@playwright/test";
import { SEED_CREDENTIALS } from "../prisma/seedAuth";

async function login(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/auth/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
}

test.describe("auth & route gating", () => {
  test("unauthenticated protected routes redirect to login", async ({ page }) => {
    await page.goto("/parent/dashboard");
    await expect(page).toHaveURL(/\/auth\/login/);

    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("parent logs in and lands on the parent dashboard", async ({ page }) => {
    const { email, password } = SEED_CREDENTIALS.parent;
    await login(page, email, password);
    await expect(page).toHaveURL(/\/parent\/dashboard/);
  });

  test("a parent cannot reach the admin panel", async ({ page }) => {
    const { email, password } = SEED_CREDENTIALS.parent;
    await login(page, email, password);
    await expect(page).toHaveURL(/\/parent\/dashboard/);
    await page.goto("/admin/dashboard");
    // Middleware bounces a parent away from /admin/*.
    await expect(page).not.toHaveURL(/\/admin\/dashboard/);
  });

  test("the superadmin reaches the admin dashboard", async ({ page }) => {
    const { email, password } = SEED_CREDENTIALS.superadmin;
    await login(page, email, password);
    await expect(page).toHaveURL(/\/admin\/dashboard/);
  });
});
