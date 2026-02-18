import { test, expect } from '@playwright/test';

test.describe('Sign Up Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-up');
  });

  test('renders the sign-up form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'NeoBank' })).toBeVisible();
    await expect(page.getByText('Create your account')).toBeVisible();
    await expect(page.getByLabel('Full Name')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Confirm Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
  });

  test('shows link to sign in page', async ({ page }) => {
    const signInLink = page.getByRole('link', { name: 'Sign In' });
    await expect(signInLink).toBeVisible();
    await expect(signInLink).toHaveAttribute('href', '/sign-in');
  });

  test('shows password validation error for short password', async ({ page }) => {
    await page.getByLabel('Password', { exact: true }).fill('short');
    // Trigger blur/change
    await page.getByLabel('Confirm Password').click();
    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible();
  });

  test('shows password mismatch error', async ({ page }) => {
    await page.getByLabel('Password', { exact: true }).fill('ValidPassword123');
    await page.getByLabel('Confirm Password').fill('DifferentPassword');
    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('disables submit when passwords do not match', async ({ page }) => {
    await page.getByLabel('Full Name').fill('Test User');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password', { exact: true }).fill('ValidPassword123');
    await page.getByLabel('Confirm Password').fill('Mismatch');
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeDisabled();
  });

  test('successful signup redirects to onboarding', async ({ page }) => {
    const uniqueEmail = `e2e-signup-${Date.now()}@test.com`;
    await page.getByLabel('Full Name').fill('New User');
    await page.getByLabel('Email').fill(uniqueEmail);
    await page.getByLabel('Password', { exact: true }).fill('ValidPassword123!');
    await page.getByLabel('Confirm Password').fill('ValidPassword123!');
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Should show loading state
    await expect(page.getByText('Creating account...')).toBeVisible();

    // Should redirect to onboarding welcome
    await page.waitForURL(/\/onboarding\/welcome/, { timeout: 15_000 });
  });

  test('shows error for duplicate email', async ({ page }) => {
    // First, create an account
    const email = `e2e-dup-${Date.now()}@test.com`;
    await page.getByLabel('Full Name').fill('First User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('ValidPassword123!');
    await page.getByLabel('Confirm Password').fill('ValidPassword123!');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForURL(/\/onboarding/, { timeout: 15_000 });

    // Now try to sign up again with the same email
    await page.goto('/sign-up');
    await page.getByLabel('Full Name').fill('Second User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('ValidPassword123!');
    await page.getByLabel('Confirm Password').fill('ValidPassword123!');
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Should show error
    await expect(page.getByText(/Could not create account|already/i)).toBeVisible({ timeout: 10_000 });
  });
});
