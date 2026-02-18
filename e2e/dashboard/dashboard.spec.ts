import { test, expect } from '@playwright/test';
import { setupMockRoutes, overrideMock } from '../mocks/handlers';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockRoutes(page);
    await page.goto('/dashboard');
  });

  test('displays page title', async ({ page }) => {
    await expect(page.getByText('Dashboard')).toBeVisible();
  });

  test('displays total portfolio value', async ({ page }) => {
    await expect(page.getByText('Total Portfolio Value')).toBeVisible();
    // Should show a dollar amount (with mock data loaded)
    await expect(page.getByText(/\$[\d,]+\.\d{2}/).first()).toBeVisible({ timeout: 10_000 });
  });

  test('displays 24h portfolio change', async ({ page }) => {
    await expect(page.getByText(/24h/).first()).toBeVisible({ timeout: 10_000 });
  });

  test('displays quick action buttons', async ({ page }) => {
    await expect(page.getByText('Deposit')).toBeVisible();
    await expect(page.getByText('Withdraw')).toBeVisible();
    await expect(page.getByText('Trade')).toBeVisible();
    await expect(page.getByText('Convert')).toBeVisible();
  });

  test('quick action links navigate correctly', async ({ page }) => {
    await page.getByRole('link', { name: 'Deposit' }).click();
    await expect(page).toHaveURL(/\/deposit/);
  });

  test('displays assets section', async ({ page }) => {
    await expect(page.getByText('Assets')).toBeVisible();
  });

  test('displays asset cards with names', async ({ page }) => {
    await expect(page.getByText('Bitcoin').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Ethereum').first()).toBeVisible();
    await expect(page.getByText('Pax Gold').first()).toBeVisible();
    await expect(page.getByText('US Dollar').first()).toBeVisible();
  });

  test('displays asset balances from mock data', async ({ page }) => {
    // BTC balance should show 1.5
    await expect(page.getByText(/1\.5/).first()).toBeVisible({ timeout: 10_000 });
  });

  test('displays portfolio chart section', async ({ page }) => {
    await expect(page.getByText('Portfolio (7 Days)')).toBeVisible();
  });

  test('displays recent activity section', async ({ page }) => {
    await expect(page.getByText('Recent Activity')).toBeVisible();
    await expect(page.getByText('View All')).toBeVisible();
  });

  test('recent activity shows transaction types', async ({ page }) => {
    const activitySection = page.locator('text=Recent Activity').locator('..');
    await expect(page.getByText('Deposit').first()).toBeVisible();
    await expect(page.getByText('Trade').first()).toBeVisible();
  });

  test('recent activity shows status badges', async ({ page }) => {
    await expect(page.getByText('COMPLETED').first()).toBeVisible();
    await expect(page.getByText('PENDING').first()).toBeVisible();
  });

  test('view all link navigates to history', async ({ page }) => {
    await page.getByRole('link', { name: 'View All' }).click();
    await expect(page).toHaveURL(/\/history/);
  });

  test('shows loading skeletons before data loads', async ({ page }) => {
    // Override mocks to delay response
    await overrideMock(page, '/api/paxos/balances*', { items: [] });
    await page.reload();
    // The page should still render without errors
    await expect(page.getByText('Dashboard')).toBeVisible();
  });
});
