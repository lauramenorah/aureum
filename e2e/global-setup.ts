import { test as setup, expect } from '@playwright/test';

const TEST_USER = {
  name: 'Test User',
  email: `e2e-${Date.now()}@test.com`,
  password: 'TestPassword123!',
};

setup('create account and authenticate', async ({ page }) => {
  // Sign up
  await page.goto('/sign-up');
  await page.getByLabel('Full Name').fill(TEST_USER.name);
  await page.getByLabel('Email').fill(TEST_USER.email);
  await page.getByLabel('Password', { exact: true }).fill(TEST_USER.password);
  await page.getByLabel('Confirm Password').fill(TEST_USER.password);
  await page.getByRole('button', { name: 'Create Account' }).click();

  // Wait for redirect to onboarding
  await page.waitForURL(/\/onboarding/, { timeout: 15_000 });

  // Now sign in to get the authenticated session
  await page.goto('/sign-in');
  await page.getByLabel('Email').fill(TEST_USER.email);
  await page.getByLabel('Password').fill(TEST_USER.password);
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Wait for redirect to dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 });

  // Save the authenticated state
  await page.context().storageState({ path: 'e2e/.auth/user.json' });
});
