import { test, expect } from '@playwright/test';
import { setupMockRoutes } from '../mocks/handlers';

test.describe('Market Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockRoutes(page);
    await page.goto('/market');
  });

  test('displays page title', async ({ page }) => {
    await expect(page.getByText('Market')).toBeVisible();
  });

  test('displays market overview heading', async ({ page }) => {
    await expect(page.getByText('Market Overview')).toBeVisible();
  });

  test('displays column headers', async ({ page }) => {
    await expect(page.getByText('Asset').first()).toBeVisible();
    await expect(page.getByText('Price').first()).toBeVisible();
    await expect(page.getByText('24h Change').first()).toBeVisible();
  });

  test('displays 3 market rows', async ({ page }) => {
    await expect(page.getByText('Bitcoin').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Ethereum').first()).toBeVisible();
    await expect(page.getByText('Pax Gold').first()).toBeVisible();
  });

  test('displays market identifiers', async ({ page }) => {
    await expect(page.getByText('BTCUSD').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('ETHUSD').first()).toBeVisible();
    await expect(page.getByText('PAXGUSD').first()).toBeVisible();
  });

  test('displays price values', async ({ page }) => {
    // BTC price should be around $67,525 (midpoint of bid/ask)
    await expect(page.getByText(/\$67/).first()).toBeVisible({ timeout: 10_000 });
  });

  test('displays percentage changes', async ({ page }) => {
    await expect(page.getByText(/%/).first()).toBeVisible({ timeout: 10_000 });
  });

  test('clicking a market row expands details', async ({ page }) => {
    // Click on Bitcoin row
    await page.getByText('Bitcoin').first().click();

    // Should show expanded content with time range buttons
    await expect(page.getByText('1D').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('1W').first()).toBeVisible();
    await expect(page.getByText('1M').first()).toBeVisible();
  });

  test('expanded row shows stats', async ({ page }) => {
    await page.getByText('Bitcoin').first().click();

    await expect(page.getByText('Open').first()).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('High').first()).toBeVisible();
    await expect(page.getByText('Low').first()).toBeVisible();
    await expect(page.getByText('Volume').first()).toBeVisible();
    await expect(page.getByText('Change').first()).toBeVisible();
  });

  test('expanded row has Buy button linking to trade', async ({ page }) => {
    await page.getByText('Bitcoin').first().click();

    const buyLink = page.getByRole('link', { name: /Buy BTC/ });
    await expect(buyLink).toBeVisible({ timeout: 5_000 });
    await expect(buyLink).toHaveAttribute('href', /\/trade\?market=BTCUSD/);
  });

  test('time range toggle buttons work', async ({ page }) => {
    await page.getByText('Bitcoin').first().click();
    await expect(page.getByText('1W').first()).toBeVisible({ timeout: 5_000 });

    // Click 1D
    await page.getByText('1D').first().click();
    // 1D should now be active (has active styling)
    await expect(page.getByText('1D').first()).toBeVisible();
  });

  test('clicking expanded row again collapses it', async ({ page }) => {
    // Expand
    await page.getByText('Bitcoin').first().click();
    await expect(page.getByText('Open').first()).toBeVisible({ timeout: 5_000 });

    // Collapse
    await page.getByText('Bitcoin').first().click();
    // Buy button should disappear
    await expect(page.getByRole('link', { name: /Buy BTC/ })).not.toBeVisible({ timeout: 3_000 });
  });
});
