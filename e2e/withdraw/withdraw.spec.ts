import { test, expect } from '@playwright/test';
import { setupMockRoutes } from '../mocks/handlers';

test.describe('Withdraw Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockRoutes(page);
    await page.goto('/withdraw');
  });

  test('displays page title', async ({ page }) => {
    await expect(page.getByText('Withdraw Funds')).toBeVisible();
    await expect(page.getByText('Send crypto or wire fiat')).toBeVisible();
  });

  test('displays Crypto and Fiat Wire tabs', async ({ page }) => {
    await expect(page.getByText('Crypto')).toBeVisible();
    await expect(page.getByText('Fiat Wire')).toBeVisible();
  });

  test('crypto tab shows withdrawal form', async ({ page }) => {
    await expect(page.getByText('Withdrawal Details')).toBeVisible();
    await expect(page.getByLabel('Asset')).toBeVisible();
    await expect(page.getByLabel('Network')).toBeVisible();
  });

  test('crypto tab has destination address input', async ({ page }) => {
    await expect(page.getByText('Destination Address')).toBeVisible();
    await expect(page.getByPlaceholder('Enter wallet address')).toBeVisible();
  });

  test('crypto tab has amount input with MAX button', async ({ page }) => {
    await expect(page.getByText('Amount').first()).toBeVisible();
    await expect(page.getByText('MAX').first()).toBeVisible();
  });

  test('fee estimate button is disabled without all fields', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Get Fee Estimate' })).toBeDisabled();
  });

  test('filling all fields enables fee estimate button', async ({ page }) => {
    await page.getByLabel('Asset').selectOption('BTC');
    await page.getByPlaceholder('Enter wallet address').fill('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
    await page.getByPlaceholder('0.00').first().fill('0.1');

    await expect(page.getByRole('button', { name: 'Get Fee Estimate' })).toBeEnabled({ timeout: 3_000 });
  });

  test('getting fee estimate shows fee details', async ({ page }) => {
    await page.getByLabel('Asset').selectOption('BTC');
    await page.getByPlaceholder('Enter wallet address').fill('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh');
    await page.getByPlaceholder('0.00').first().fill('0.1');
    await page.getByRole('button', { name: 'Get Fee Estimate' }).click();

    await expect(page.getByText('Fee Estimate')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Network Fee')).toBeVisible();
    await expect(page.getByText('Total Deducted')).toBeVisible();
  });

  test('shows save address checkbox when entering address', async ({ page }) => {
    await page.getByPlaceholder('Enter wallet address').fill('0xabc123');
    await expect(page.getByText('Save this address')).toBeVisible();
  });

  test('switching to fiat tab shows bank accounts', async ({ page }) => {
    await page.getByText('Fiat Wire').click();
    await expect(page.getByText('Bank Accounts')).toBeVisible();
  });

  test('fiat tab shows existing bank account from mock', async ({ page }) => {
    await page.getByText('Fiat Wire').click();
    // Mock has Chase Bank account
    await expect(page.getByText('Chase Bank').first()).toBeVisible({ timeout: 10_000 });
  });

  test('fiat tab has withdrawal amount section', async ({ page }) => {
    await page.getByText('Fiat Wire').click();
    await expect(page.getByText('Withdrawal Amount')).toBeVisible();
    await expect(page.getByText('Amount (USD)')).toBeVisible();
  });

  test('fiat tab shows insufficient balance warning', async ({ page }) => {
    await page.getByText('Fiat Wire').click();
    // Enter an amount larger than USD balance
    await page.getByPlaceholder('0.00').first().fill('999999999');
    await expect(page.getByText('Insufficient balance')).toBeVisible();
  });
});
