import { test, expect } from '@playwright/test';
import { setupMockRoutes } from '../mocks/handlers';

test.describe('Transfer Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockRoutes(page);
    await page.goto('/transfer');
  });

  test('displays page title', async ({ page }) => {
    await expect(page.getByText('Transfer')).toBeVisible();
  });

  test('displays Internal and External tabs', async ({ page }) => {
    await expect(page.getByText('Between My Profiles')).toBeVisible();
    await expect(page.getByText('To Another Entity')).toBeVisible();
  });

  test('internal tab shows source and destination profile selectors', async ({ page }) => {
    await expect(page.getByLabel('Source Profile')).toBeVisible();
    await expect(page.getByLabel('Destination Profile')).toBeVisible();
  });

  test('internal tab shows asset selector', async ({ page }) => {
    await expect(page.getByLabel('Asset')).toBeVisible();
  });

  test('internal tab shows amount input', async ({ page }) => {
    await expect(page.getByLabel('Amount')).toBeVisible();
  });

  test('transfer button is disabled without all fields', async ({ page }) => {
    const transferBtn = page.getByRole('button', { name: 'Transfer' }).first();
    await expect(transferBtn).toBeDisabled();
  });

  test('switching to external tab shows destination profile ID input', async ({ page }) => {
    await page.getByText('To Another Entity').click();
    await expect(page.getByLabel('Destination Profile ID')).toBeVisible();
  });

  test('external tab shows asset selector and amount input', async ({ page }) => {
    await page.getByText('To Another Entity').click();
    await expect(page.getByLabel('Asset')).toBeVisible();
    await expect(page.getByLabel('Amount')).toBeVisible();
  });

  test('external tab transfer button is disabled without fields', async ({ page }) => {
    await page.getByText('To Another Entity').click();
    const transferBtn = page.getByRole('button', { name: 'Transfer' }).first();
    await expect(transferBtn).toBeDisabled();
  });

  test('filling external fields enables transfer button', async ({ page }) => {
    await page.getByText('To Another Entity').click();
    await page.getByLabel('Destination Profile ID').fill('some-profile-id');
    await page.getByLabel('Asset').selectOption('BTC');
    await page.getByPlaceholder('0.00').fill('0.5');

    const transferBtn = page.getByRole('button', { name: 'Transfer' }).first();
    await expect(transferBtn).toBeEnabled({ timeout: 3_000 });
  });

  test('clicking transfer opens confirmation modal', async ({ page }) => {
    await page.getByText('To Another Entity').click();
    await page.getByLabel('Destination Profile ID').fill('some-profile-id');
    await page.getByLabel('Asset').selectOption('BTC');
    await page.getByPlaceholder('0.00').fill('0.5');
    await page.getByRole('button', { name: 'Transfer' }).first().click();

    await expect(page.getByText('Confirm Transfer')).toBeVisible();
    await expect(page.getByText('External Transfer')).toBeVisible();
  });

  test('confirmation modal has cancel and confirm buttons', async ({ page }) => {
    await page.getByText('To Another Entity').click();
    await page.getByLabel('Destination Profile ID').fill('some-profile-id');
    await page.getByLabel('Asset').selectOption('BTC');
    await page.getByPlaceholder('0.00').fill('0.5');
    await page.getByRole('button', { name: 'Transfer' }).first().click();

    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Confirm Transfer' })).toBeVisible();
  });

  test('displays transfer history section', async ({ page }) => {
    await expect(page.getByText('Transfer History')).toBeVisible();
  });

  test('transfer history shows mock data', async ({ page }) => {
    // From mock data: transfer-001 is COMPLETED BTC deposit
    await expect(page.getByText('BTC').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('COMPLETED').first()).toBeVisible();
  });

  test('transfer history table shows column headers', async ({ page }) => {
    await expect(page.getByText('Date').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Type').first()).toBeVisible();
    await expect(page.getByText('Asset').first()).toBeVisible();
    await expect(page.getByText('Amount').first()).toBeVisible();
    await expect(page.getByText('Status').first()).toBeVisible();
  });
});
