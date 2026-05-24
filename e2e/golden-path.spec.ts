import { test, expect } from "@playwright/test";
import { SEED_CREDENTIALS } from "../prisma/seedAuth";

// The canonical flow from CLAUDE.md: parent → child → generate quiz →
// take it → see results. Exercises real pages, the mock generator, the
// submit endpoint, the adaptive engine and the results render.
test("parent generates a quiz, completes it, and sees results", async ({ page }) => {
  const { email, password } = SEED_CREDENTIALS.parent;

  await page.goto("/auth/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page).toHaveURL(/\/parent\/dashboard/);

  // Open the first child's detail page.
  await page.locator('a[href^="/parent/child/"]').first().click();
  await expect(page).toHaveURL(/\/parent\/child\/\d+/);

  // Generate a quiz — navigates to /quiz/[id].
  await page.getByRole("button", { name: "New quiz" }).click();
  await page.waitForURL(/\/quiz\/\d+/, { timeout: 20_000 });

  // Answer every question: first option for MCQ groups, a value for inputs.
  const radioNames: string[] = await page
    .locator('input[type="radio"]')
    .evaluateAll((els) => [
      ...new Set(els.map((e) => (e as HTMLInputElement).name)),
    ]);
  for (const name of radioNames) {
    await page.locator(`input[name="${name}"]`).first().check();
  }
  const textInputs = page.locator('input[inputmode="decimal"]');
  const textCount = await textInputs.count();
  for (let i = 0; i < textCount; i++) {
    await textInputs.nth(i).fill("1");
  }

  await page.getByRole("button", { name: "Submit quiz" }).click();
  await page.getByRole("button", { name: /Continue to results/ }).click();

  await expect(page).toHaveURL(/\/quiz\/\d+\/results/);
  await expect(
    page.getByRole("heading", { name: /results/i }),
  ).toBeVisible();
});
