import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow', () => {
  let email: string;

  test.beforeEach(async ({ page }) => {
    // Create a fresh account for each test
    email = `e2e-onboard-${Date.now()}@test.com`;
    await page.goto('/sign-up');
    await page.getByLabel('Full Name').fill('Onboard User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('ValidPassword123!');
    await page.getByLabel('Confirm Password').fill('ValidPassword123!');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForURL(/\/onboarding\/welcome/, { timeout: 15_000 });
  });

  test('welcome page renders correctly', async ({ page }) => {
    await expect(page.getByText('NeoBank')).toBeVisible();
    await expect(page.getByText(/Welcome|Get Started/i)).toBeVisible();
  });

  test('welcome page has continue button', async ({ page }) => {
    // The welcome page should have a way to proceed
    const continueBtn = page.getByRole('link', { name: /Continue|Get Started|Next/i }).or(
      page.getByRole('button', { name: /Continue|Get Started|Next/i })
    );
    await expect(continueBtn.first()).toBeVisible();
  });

  test('can navigate from welcome to identity step', async ({ page }) => {
    const continueBtn = page.getByRole('link', { name: /Continue|Get Started|Next/i }).or(
      page.getByRole('button', { name: /Continue|Get Started|Next/i })
    );
    await continueBtn.first().click();
    await page.waitForURL(/\/onboarding\/(identity|personal-info)/, { timeout: 10_000 });
  });

  test('identity page renders form fields', async ({ page }) => {
    await page.goto('/onboarding/identity');
    // Should have form fields for identity information
    await expect(page.locator('form').or(page.locator('input')).first()).toBeVisible({ timeout: 5_000 });
  });

  test('personal-info page renders', async ({ page }) => {
    await page.goto('/onboarding/personal-info');
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 5_000 });
  });

  test('address page renders', async ({ page }) => {
    await page.goto('/onboarding/address');
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 5_000 });
  });

  test('tax-details page renders', async ({ page }) => {
    await page.goto('/onboarding/tax-details');
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 5_000 });
  });

  test('documents page renders', async ({ page }) => {
    await page.goto('/onboarding/documents');
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 5_000 });
  });

  test('review page renders', async ({ page }) => {
    await page.goto('/onboarding/review');
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 5_000 });
  });

  test('pending page renders', async ({ page }) => {
    await page.goto('/onboarding/pending');
    await expect(page.getByText(/pending|review|processing/i).first()).toBeVisible({ timeout: 5_000 });
  });

  test('approved page renders', async ({ page }) => {
    await page.goto('/onboarding/approved');
    await expect(page.getByText(/approved|congratulations|success/i).first()).toBeVisible({ timeout: 5_000 });
  });

  test('denied page renders', async ({ page }) => {
    await page.goto('/onboarding/denied');
    await expect(page.getByText(/denied|rejected|unable/i).first()).toBeVisible({ timeout: 5_000 });
  });
});
