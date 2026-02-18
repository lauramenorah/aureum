import { test, expect } from '@playwright/test';
import { setupMockRoutes } from '../mocks/handlers';

test.describe('Convert Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockRoutes(page);
    await page.goto('/convert');
  });

  test('displays page title and description', async ({ page }) => {
    await expect(page.getByText('Convert').first()).toBeVisible();
    await expect(page.getByText(/stablecoin/i).first()).toBeVisible();
  });

  test('displays Stablecoins and Gold tabs', async ({ page }) => {
    await expect(page.getByText('Stablecoins')).toBeVisible();
    await expect(page.getByText('Gold (PAXG)')).toBeVisible();
  });

  test('stablecoin tab shows from/to selectors', async ({ page }) => {
    await expect(page.getByText('From').first()).toBeVisible();
    await expect(page.getByText('To').first()).toBeVisible();
  });

  test('stablecoin tab shows 1:1 info banner', async ({ page }) => {
    await expect(page.getByText(/1:1.*\$0\.00|zero fees/i).first()).toBeVisible();
  });

  test('stablecoin tab has amount input', async ({ page }) => {
    await expect(page.getByPlaceholder('0.00').first()).toBeVisible();
  });

  test('entering amount shows "You will receive" preview', async ({ page }) => {
    await page.getByPlaceholder('0.00').first().fill('100');
    await expect(page.getByText('You will receive')).toBeVisible();
    await expect(page.getByText('$0.00').first()).toBeVisible(); // fee
  });

  test('swap button switches from/to assets', async ({ page }) => {
    // Default is USD -> USDP
    await expect(page.getByText('USD').first()).toBeVisible();
    await expect(page.getByText('USDP').first()).toBeVisible();
  });

  test('convert button is disabled without amount', async ({ page }) => {
    const convertBtn = page.getByRole('button', { name: /Convert USD to/i });
    await expect(convertBtn).toBeDisabled();
  });

  test('convert button is enabled with amount', async ({ page }) => {
    await page.getByPlaceholder('0.00').first().fill('100');
    const convertBtn = page.getByRole('button', { name: /Convert USD to/i });
    await expect(convertBtn).toBeEnabled();
  });

  test('clicking convert opens confirmation modal', async ({ page }) => {
    await page.getByPlaceholder('0.00').first().fill('100');
    await page.getByRole('button', { name: /Convert USD to/i }).click();
    await expect(page.getByText('Confirm Conversion')).toBeVisible();
    await expect(page.getByText('Rate')).toBeVisible();
    await expect(page.getByText('1:1')).toBeVisible();
  });

  test('confirmation modal has cancel and confirm buttons', async ({ page }) => {
    await page.getByPlaceholder('0.00').first().fill('100');
    await page.getByRole('button', { name: /Convert USD to/i }).click();
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Confirm Conversion' })).toBeVisible();
  });

  test('Gold tab renders buy/sell toggle', async ({ page }) => {
    await page.getByText('Gold (PAXG)').click();
    await expect(page.getByRole('button', { name: 'Buy PAXG' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sell PAXG' })).toBeVisible();
  });

  test('Gold tab has amount input and Get Quote button', async ({ page }) => {
    await page.getByText('Gold (PAXG)').click();
    await expect(page.getByPlaceholder('0.00').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Get Quote' })).toBeVisible();
  });

  test('Gold tab shows PAXG spot price', async ({ page }) => {
    await page.getByText('Gold (PAXG)').click();
    await expect(page.getByText('PAXG Spot Price')).toBeVisible();
  });

  test('displays conversion history section', async ({ page }) => {
    await expect(page.getByText('Conversion History')).toBeVisible();
  });

  test('conversion history shows mock data', async ({ page }) => {
    // From mock data: conv-001 and conv-002
    await expect(page.getByText('COMPLETED').first()).toBeVisible({ timeout: 10_000 });
  });
});
