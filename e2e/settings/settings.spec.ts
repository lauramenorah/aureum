import { test, expect } from '@playwright/test';
import { setupMockRoutes, overrideMock } from '../mocks/handlers';

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockRoutes(page);
    await page.goto('/settings');
  });

  test('displays page title', async ({ page }) => {
    await expect(page.getByText('Settings')).toBeVisible();
  });

  // ── Bank Accounts Section ──

  test('displays Bank Accounts section', async ({ page }) => {
    await expect(page.getByText('Bank Accounts')).toBeVisible();
  });

  test('displays Add Bank Account button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Add Bank Account/i })).toBeVisible();
  });

  test('shows bank account from mock data', async ({ page }) => {
    // fiat-accounts.json has Chase Bank
    await expect(page.getByText('Chase Bank').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('CHECKING')).toBeVisible();
    await expect(page.getByText('Test User').first()).toBeVisible();
  });

  test('clicking Add Bank Account shows form', async ({ page }) => {
    await page.getByRole('button', { name: /Add Bank Account/i }).click();
    await expect(page.getByLabel('Bank Name')).toBeVisible();
    await expect(page.getByLabel('Beneficiary Name')).toBeVisible();
    await expect(page.getByLabel('Account Number')).toBeVisible();
    await expect(page.getByLabel('Routing Number')).toBeVisible();
  });

  test('bank form has account type toggle', async ({ page }) => {
    await page.getByRole('button', { name: /Add Bank Account/i }).click();
    await expect(page.getByText('CHECKING')).toBeVisible();
    await expect(page.getByText('SAVINGS')).toBeVisible();
  });

  test('Save Bank Account button is disabled without required fields', async ({ page }) => {
    await page.getByRole('button', { name: /Add Bank Account/i }).click();
    await expect(page.getByRole('button', { name: /Save Bank Account/i })).toBeDisabled();
  });

  // ── Saved Crypto Addresses Section ──

  test('displays Saved Crypto Addresses section', async ({ page }) => {
    await expect(page.getByText('Saved Crypto Addresses')).toBeVisible();
  });

  test('displays Add Address button for crypto', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Add Address/i })).toBeVisible();
  });

  test('empty crypto addresses shows empty state', async ({ page }) => {
    await expect(page.getByText('No saved crypto addresses')).toBeVisible({ timeout: 10_000 });
  });

  test('clicking Add Address shows crypto form', async ({ page }) => {
    await page.getByRole('button', { name: /Add Address/i }).click();
    await expect(page.getByLabel('Address')).toBeVisible();
    await expect(page.getByLabel('Network')).toBeVisible();
    await expect(page.getByLabel('Nickname')).toBeVisible();
  });

  // ── Transfer Limits Section ──

  test('displays Transfer Limits section', async ({ page }) => {
    await expect(page.getByText('Transfer Limits')).toBeVisible();
  });

  test('transfer limits table shows assets', async ({ page }) => {
    await expect(page.getByText('Daily Limit')).toBeVisible();
    await expect(page.getByText('Monthly Limit')).toBeVisible();
    await expect(page.getByText('Per Transaction')).toBeVisible();
  });

  test('transfer limits shows BTC and ETH rows', async ({ page }) => {
    await expect(page.getByText('10 BTC')).toBeVisible();
    await expect(page.getByText('100 ETH')).toBeVisible();
  });

  test('shows contact support info for limits', async ({ page }) => {
    await expect(page.getByText(/Need higher limits/i)).toBeVisible();
  });

  // ── Recent Events Section ──

  test('displays Recent Events section', async ({ page }) => {
    await expect(page.getByText('Recent Events')).toBeVisible();
  });

  test('shows no events message when empty', async ({ page }) => {
    await expect(page.getByText('No events recorded')).toBeVisible({ timeout: 10_000 });
  });

  // ── Environment Info Section ──

  test('displays Environment Info section', async ({ page }) => {
    await expect(page.getByText('Environment Info')).toBeVisible();
  });

  test('shows API Base URL', async ({ page }) => {
    await expect(page.getByText('API Base URL')).toBeVisible();
  });

  // ── Delete Confirmation ──

  test('clicking delete on bank account shows confirmation', async ({ page }) => {
    await expect(page.getByText('Chase Bank').first()).toBeVisible({ timeout: 10_000 });

    // Find and click the delete button (Trash2 icon) near Chase Bank
    const bankCard = page.getByText('Chase Bank').first().locator('..');
    // Click the trash button in the settings page
    await page.locator('button:has(svg)').filter({ has: page.locator('svg') }).last().click();

    await expect(page.getByText('Confirm Deletion')).toBeVisible({ timeout: 3_000 });
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible();
  });
});
