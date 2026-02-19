import { test, expect } from '@playwright/test';

test.describe('Sign In Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-in');
  });

  test('renders the sign-in form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Aureum' })).toBeVisible();
    await expect(page.getByText('Sign in to your account')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });

  test('shows link to sign up page', async ({ page }) => {
    const signUpLink = page.getByRole('link', { name: 'Sign Up' });
    await expect(signUpLink).toBeVisible();
    await expect(signUpLink).toHaveAttribute('href', '/sign-up');
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.getByLabel('Email').fill('nonexistent@test.com');
    await page.getByLabel('Password').fill('WrongPassword123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Should show loading state then error
    await expect(page.getByText('Signing in...')).toBeVisible();
    await expect(page.getByText(/Invalid email or password|No account found/i)).toBeVisible({
      timeout: 10_000,
    });
  });

  test('shows loading state during sign-in', async ({ page }) => {
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('SomePassword123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('Signing in...')).toBeVisible();
  });

  test('successful sign-in redirects to dashboard', async ({ page }) => {
    // First create an account
    const email = `e2e-signin-${Date.now()}@test.com`;
    await page.goto('/sign-up');
    await page.getByLabel('Full Name').fill('Login User');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill('ValidPassword123!');
    await page.getByLabel('Confirm Password').fill('ValidPassword123!');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForURL(/\/onboarding/, { timeout: 15_000 });

    // Now sign in
    await page.goto('/sign-in');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill('ValidPassword123!');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
  });

  test('email field requires valid email format', async ({ page }) => {
    const emailInput = page.getByLabel('Email');
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(emailInput).toHaveAttribute('required', '');
  });

  test('password field is of type password', async ({ page }) => {
    const passwordInput = page.getByLabel('Password');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(passwordInput).toHaveAttribute('required', '');
  });
});
