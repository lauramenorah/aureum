import { test, expect } from '@playwright/test';
import { setupMockRoutes, overrideMock } from '../mocks/handlers';

test.describe('Earn Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockRoutes(page);
    await page.goto('/earn');
  });

  test('displays page title', async ({ page }) => {
    await expect(page.getByText('Earn')).toBeVisible();
  });

  test('displays hero section with USDG rewards info', async ({ page }) => {
    await expect(page.getByText('Earn USDG Rewards')).toBeVisible();
    await expect(page.getByText(/monitored.*addresses/i)).toBeVisible();
  });

  test('displays Monitored Addresses section', async ({ page }) => {
    await expect(page.getByText('Monitored Addresses')).toBeVisible();
  });

  test('displays Add Address button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Add Address/i })).toBeVisible();
  });

  test('empty state shows when no monitoring addresses', async ({ page }) => {
    // Default mock returns empty items for monitoring-addresses
    await expect(page.getByText('No monitored addresses')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Add your first address/i)).toBeVisible();
  });

  test('clicking Add Address shows form', async ({ page }) => {
    await page.getByRole('button', { name: /Add Address/i }).click();
    await expect(page.getByLabel('Wallet Address')).toBeVisible();
    await expect(page.getByLabel('Network')).toBeVisible();
    await expect(page.getByLabel('Nickname')).toBeVisible();
  });

  test('form has network options', async ({ page }) => {
    await page.getByRole('button', { name: /Add Address/i }).click();
    const networkSelect = page.getByLabel('Network');
    await expect(networkSelect).toBeVisible();
  });

  test('Save Address button is disabled without required fields', async ({ page }) => {
    await page.getByRole('button', { name: /Add Address/i }).click();
    await expect(page.getByRole('button', { name: /Save Address/i })).toBeDisabled();
  });

  test('filling address and network enables Save button', async ({ page }) => {
    await page.getByRole('button', { name: /Add Address/i }).click();
    await page.getByPlaceholder('0x... or base58 address').fill('0x1234567890abcdef');
    await page.getByLabel('Network').selectOption('ETHEREUM');

    await expect(page.getByRole('button', { name: /Save Address/i })).toBeEnabled({ timeout: 3_000 });
  });

  test('Cancel button hides form', async ({ page }) => {
    await page.getByRole('button', { name: /Add Address/i }).click();
    await expect(page.getByLabel('Wallet Address')).toBeVisible();

    await page.getByRole('button', { name: 'Cancel' }).first().click();
    await expect(page.getByLabel('Wallet Address')).not.toBeVisible({ timeout: 3_000 });
  });

  test('displays Reward Statements section', async ({ page }) => {
    await expect(page.getByText('Reward Statements')).toBeVisible();
    await expect(page.getByText('No reward statements yet')).toBeVisible();
  });

  test('reward statements table shows column headers', async ({ page }) => {
    await expect(page.getByText('Period').first()).toBeVisible();
    await expect(page.getByText('Eligible Balance').first()).toBeVisible();
    await expect(page.getByText('Reward Amount').first()).toBeVisible();
  });

  test('shows addresses when mock has data', async ({ page }) => {
    // Override with monitoring addresses
    await overrideMock(page, '/api/paxos/monitoring-addresses', {
      items: [
        {
          id: 'mon-001',
          address: '0x1234567890abcdef1234567890abcdef12345678',
          network: 'ETHEREUM',
          nickname: 'My Metamask',
          created_at: '2025-01-01T00:00:00Z',
        },
      ],
    });
    await page.goto('/earn');

    await expect(page.getByText('0x123456...345678')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('ETHEREUM')).toBeVisible();
    await expect(page.getByText('My Metamask')).toBeVisible();
    await expect(page.getByText('Monitoring')).toBeVisible();
  });
});
