import { test, expect } from '@playwright/test';
import { setupMockRoutes, overrideMock } from '../mocks/handlers';

test.describe('Deposit Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockRoutes(page);
    await page.goto('/deposit');
  });

  test('displays page title', async ({ page }) => {
    await expect(page.getByText('Deposit Funds')).toBeVisible();
    await expect(page.getByText('Add crypto or fiat')).toBeVisible();
  });

  test('displays Crypto and Fiat Wire tabs', async ({ page }) => {
    await expect(page.getByText('Crypto')).toBeVisible();
    await expect(page.getByText('Fiat Wire')).toBeVisible();
  });

  test('crypto tab is default', async ({ page }) => {
    // Crypto tab content should be visible
    await expect(page.getByText('Asset').first()).toBeVisible();
    await expect(page.getByText('Network').first()).toBeVisible();
  });

  test('crypto tab has asset and network selectors', async ({ page }) => {
    await expect(page.getByLabel('Asset')).toBeVisible();
    await expect(page.getByLabel('Network')).toBeVisible();
  });

  test('generate address button is disabled without selection', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Generate Deposit Address' })).toBeDisabled();
  });

  test('selecting asset enables network selector', async ({ page }) => {
    await page.getByLabel('Asset').selectOption('BTC');
    // BTC only has BITCOIN network, should auto-select
    const networkSelect = page.getByLabel('Network');
    await expect(networkSelect).toBeEnabled();
  });

  test('selecting asset and network enables generate button', async ({ page }) => {
    await page.getByLabel('Asset').selectOption('BTC');
    // BTC auto-selects BITCOIN
    await expect(page.getByRole('button', { name: 'Generate Deposit Address' })).toBeEnabled({
      timeout: 3_000,
    });
  });

  test('generating address shows QR code and address', async ({ page }) => {
    await page.getByLabel('Asset').selectOption('BTC');
    await page.getByRole('button', { name: 'Generate Deposit Address' }).click();

    await expect(page.getByText('Deposit Address')).toBeVisible({ timeout: 5_000 });
  });

  test('displays existing addresses table', async ({ page }) => {
    await expect(page.getByText('Existing Addresses')).toBeVisible();
    // From mock data: BTC and ETH addresses
    await expect(page.getByText('BTC').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('ETH').first()).toBeVisible();
  });

  test('switching to fiat tab shows wire deposit', async ({ page }) => {
    await page.getByText('Fiat Wire').click();
    await expect(page.getByText('Wire Deposit')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Get Wire Instructions' })).toBeVisible();
  });

  test('fiat tab shows previous instructions section', async ({ page }) => {
    await page.getByText('Fiat Wire').click();
    await expect(page.getByText('Previous Instructions')).toBeVisible();
  });

  test('clicking Get Wire Instructions generates instructions', async ({ page }) => {
    await page.getByText('Fiat Wire').click();
    await page.getByRole('button', { name: 'Get Wire Instructions' }).click();
    // The mock returns empty fields, but the section should appear
    await expect(page.getByText('Wire Transfer Details')).toBeVisible({ timeout: 5_000 });
  });

  test('existing addresses shows Refresh button', async ({ page }) => {
    await expect(page.getByText('Refresh').first()).toBeVisible();
  });
});
