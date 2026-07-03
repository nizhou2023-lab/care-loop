const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("core medication plan, check-in, history, and delete flow", async ({ page }) => {
  const medName = `Evening capsule ${Date.now()}`;

  await expect(page.getByRole("heading", { name: "Stay on your treatment path." })).toBeVisible();

  await page.getByRole("button", { name: "Add Medication" }).click();
  await page.locator("#med-name").fill(medName);
  await page.locator("#med-dose").fill("1 capsule after dinner");
  await page.getByRole("button", { name: "Done" }).click();

  await expect(page.getByText("Today's medications")).toBeVisible();
  const todayCard = page.locator("article.task-card").filter({ hasText: medName });
  await expect(todayCard).toBeVisible();

  await todayCard.getByRole("button", { name: "Taken" }).click();
  await expect(todayCard.getByRole("button", { name: "Recorded" })).toBeDisabled();

  await page.reload();
  const reloadedTodayCard = page.locator("article.task-card").filter({ hasText: medName });
  await expect(reloadedTodayCard.getByRole("button", { name: "Recorded" })).toBeDisabled();

  await page.getByRole("button", { name: "History" }).click();
  await expect(page.getByText(`${medName} - Taken`)).toBeVisible();

  await page.getByRole("button", { name: "Plan" }).click();
  const activePlanCard = page.locator("article.health-card").filter({ hasText: medName });
  await expect(activePlanCard).toBeVisible();
  await activePlanCard.getByRole("button", { name: "Archive" }).click();

  const archivedPlanCard = page.locator("article.health-card").filter({ hasText: medName });
  await expect(archivedPlanCard.getByRole("button", { name: "Delete" })).toBeVisible();
  await archivedPlanCard.getByRole("button", { name: "Delete" }).click();

  await expect(page.getByRole("heading", { name: "Medications" })).toBeVisible();
  await expect(page.locator("article.health-card").filter({ hasText: medName })).toHaveCount(0);

  await page.getByRole("button", { name: "History" }).click();
  await expect(page.getByText(`${medName} - Taken`)).toBeVisible();
});
