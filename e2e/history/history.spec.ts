import { test, expect } from '@playwright/test';
import { setupMockRoutes, overrideMock } from '../mocks/handlers';

test.describe('History Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockRoutes(page);
    await page.goto('/history');
  });

  test('displays page title and description', async ({ page }) => {
    await expect(page.getByText('History')).toBeVisible();
    await expect(page.getByText(/transaction history/i)).toBeVisible();
  });

  test('displays Export CSV button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Export CSV/i })).toBeVisible();
  });

  test('displays stat cards', async ({ page }) => {
    await expect(page.getByText('Total').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Completed').first()).toBeVisible();
    await expect(page.getByText('Pending').first()).toBeVisible();
    await expect(page.getByText('Failed').first()).toBeVisible();
  });

  test('displays filter tabs', async ({ page }) => {
    await expect(page.getByText('All').first()).toBeVisible();
    await expect(page.getByText('Deposits').first()).toBeVisible();
    await expect(page.getByText('Withdrawals').first()).toBeVisible();
    await expect(page.getByText('Trades').first()).toBeVisible();
    await expect(page.getByText('Conversions').first()).toBeVisible();
    await expect(page.getByText('Transfers').first()).toBeVisible();
  });

  test('displays search input', async ({ page }) => {
    await expect(page.getByPlaceholder(/Search by ID/i)).toBeVisible();
  });

  test('displays transaction rows from mock data', async ({ page }) => {
    // Mock transfers have COMPLETED status, mock orders have FILLED status
    await expect(page.getByText('COMPLETED').first()).toBeVisible({ timeout: 10_000 });
  });

  test('displays Showing count text', async ({ page }) => {
    await expect(page.getByText(/Showing \d+ of \d+ transactions/)).toBeVisible({ timeout: 10_000 });
  });

  test('clicking a transaction row expands details', async ({ page }) => {
    // Wait for transactions to load
    await expect(page.getByText('COMPLETED').first()).toBeVisible({ timeout: 10_000 });

    // Click the first transaction row
    await page.getByText('deposit').first().click();

    // Expanded details should show
    await expect(page.getByText('Transfer ID').first()).toBeVisible({ timeout: 5_000 });
  });

  test('filter by Deposits tab', async ({ page }) => {
    await expect(page.getByText('COMPLETED').first()).toBeVisible({ timeout: 10_000 });
    await page.getByText('Deposits').first().click();

    // Should only show deposit type transactions
    await expect(page.getByText('deposit').first()).toBeVisible({ timeout: 5_000 });
  });

  test('search filters transactions', async ({ page }) => {
    await expect(page.getByText('COMPLETED').first()).toBeVisible({ timeout: 10_000 });
    await page.getByPlaceholder(/Search by ID/i).fill('BTC');

    // Should filter to BTC transactions
    await expect(page.getByText('BTC').first()).toBeVisible({ timeout: 5_000 });
  });

  test('empty state shows when no results match filters', async ({ page }) => {
    await expect(page.getByText('COMPLETED').first()).toBeVisible({ timeout: 10_000 });
    await page.getByPlaceholder(/Search by ID/i).fill('zzzznonexistent');

    await expect(page.getByText('No transactions found')).toBeVisible({ timeout: 5_000 });
  });
});
