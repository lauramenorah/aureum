import { test, expect } from '@playwright/test';
import { setupMockRoutes } from '../mocks/handlers';

test.describe('Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 812 } }); // iPhone-sized viewport

  test.beforeEach(async ({ page }) => {
    await setupMockRoutes(page);
    await page.goto('/dashboard');
  });

  test('sidebar is hidden on mobile', async ({ page }) => {
    // Sidebar has class "hidden md:flex", so it should not be visible
    await expect(page.locator('aside')).not.toBeVisible();
  });

  test('bottom tab bar is visible on mobile', async ({ page }) => {
    // Bottom nav shows primary tabs
    await expect(page.getByText('Dashboard').last()).toBeVisible();
    await expect(page.getByText('Trade').last()).toBeVisible();
    await expect(page.getByText('Convert').last()).toBeVisible();
    await expect(page.getByText('History').last()).toBeVisible();
    await expect(page.getByText('More').last()).toBeVisible();
  });

  test('tapping a primary tab navigates', async ({ page }) => {
    await page.getByText('Trade').last().click();
    await expect(page).toHaveURL(/\/trade/);
  });

  test('tapping More opens drawer', async ({ page }) => {
    await page.getByText('More').last().click();

    // Drawer should show additional nav items
    await expect(page.getByText('Deposit').last()).toBeVisible({ timeout: 3_000 });
    await expect(page.getByText('Withdraw').last()).toBeVisible();
    await expect(page.getByText('Transfer').last()).toBeVisible();
    await expect(page.getByText('Earn').last()).toBeVisible();
    await expect(page.getByText('Market').last()).toBeVisible();
    await expect(page.getByText('Accounts').last()).toBeVisible();
    await expect(page.getByText('Profiles').last()).toBeVisible();
    await expect(page.getByText('Settings').last()).toBeVisible();
  });

  test('tapping a drawer link navigates and closes drawer', async ({ page }) => {
    await page.getByText('More').last().click();
    await expect(page.getByText('Deposit').last()).toBeVisible({ timeout: 3_000 });

    await page.getByText('Deposit').last().click();
    await expect(page).toHaveURL(/\/deposit/);
  });

  test('close button closes drawer', async ({ page }) => {
    await page.getByText('More').last().click();
    await expect(page.getByText('Deposit').last()).toBeVisible({ timeout: 3_000 });

    await page.getByLabel('Close menu').click();

    // Drawer links should no longer be visible (drawer slides away)
    await expect(page.getByText('Deposit').last()).not.toBeVisible({ timeout: 3_000 });
  });

  test('clicking overlay closes drawer', async ({ page }) => {
    await page.getByText('More').last().click();
    await expect(page.getByText('Deposit').last()).toBeVisible({ timeout: 3_000 });

    // Click the overlay (bg-black/50 div behind the drawer)
    await page.locator('.bg-black\\/50').click();
    await expect(page.getByText('Deposit').last()).not.toBeVisible({ timeout: 3_000 });
  });
});
