import { test, expect } from '@playwright/test';
import { setupMockRoutes, overrideMock } from '../mocks/handlers';

test.describe('Accounts Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockRoutes(page);
    await page.goto('/accounts');
  });

  test('displays page title', async ({ page }) => {
    await expect(page.getByText('Accounts & Identity')).toBeVisible();
  });

  test('displays Identities section', async ({ page }) => {
    await expect(page.getByText('Identities')).toBeVisible();
  });

  test('displays Create Identity button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Create Identity/i })).toBeVisible();
  });

  test('displays Accounts section', async ({ page }) => {
    await expect(page.getByText('Accounts').first()).toBeVisible();
  });

  test('shows identity from mock data', async ({ page }) => {
    // Mock identities.json has identity-001 with status APPROVED
    await expect(page.getByText('APPROVED').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('INDIVIDUAL').first()).toBeVisible();
  });

  test('clicking identity expands details', async ({ page }) => {
    // Wait for identity to load
    await expect(page.getByText('APPROVED').first()).toBeVisible({ timeout: 10_000 });

    // Click identity row to expand
    await page.getByText('APPROVED').first().click();

    // Expanded content should show status description
    await expect(page.getByText('Identity verified and approved')).toBeVisible({ timeout: 5_000 });
  });

  test('shows account from mock data', async ({ page }) => {
    // Mock accounts.json has account-001
    await expect(page.getByText(/account-001/).first()).toBeVisible({ timeout: 10_000 });
  });

  test('clicking account expands member section', async ({ page }) => {
    await expect(page.getByText(/account-001/).first()).toBeVisible({ timeout: 10_000 });

    // Click account to expand
    await page.getByText(/account-001/).first().click();

    // Should show Account Members section
    await expect(page.getByText('Account Members')).toBeVisible({ timeout: 5_000 });
  });

  test('expanded account shows Add member button', async ({ page }) => {
    await expect(page.getByText(/account-001/).first()).toBeVisible({ timeout: 10_000 });
    await page.getByText(/account-001/).first().click();

    await expect(page.getByRole('button', { name: /Add/i })).toBeVisible({ timeout: 5_000 });
  });

  test('shows identity details with person info', async ({ page }) => {
    // Override with detailed identity
    await overrideMock(page, '/api/paxos/identities', {
      items: [
        {
          id: 'identity-001',
          status: 'APPROVED',
          type: 'PERSON',
          person_details: {
            first_name: 'Jane',
            last_name: 'Doe',
            email: 'jane@example.com',
            date_of_birth: '1990-01-15',
            nationality: 'US',
          },
          address: {
            street1: '123 Main St',
            city: 'New York',
            state: 'NY',
            postal_code: '10001',
            country: 'US',
          },
          tax_details: {
            tax_id_type: 'SSN',
            tax_id: '123-45-6789',
            tax_country: 'US',
          },
        },
      ],
    });
    await page.goto('/accounts');

    await expect(page.getByText('Jane').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('PERSON').first()).toBeVisible();

    // Expand to see details
    await page.getByText('Jane').first().click();
    await expect(page.getByText('First Name')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('Address')).toBeVisible();
    await expect(page.getByText('Tax Information')).toBeVisible();
  });

  test('empty identities shows empty state', async ({ page }) => {
    await overrideMock(page, '/api/paxos/identities', { items: [] });
    await page.goto('/accounts');

    await expect(page.getByText('No identities found')).toBeVisible({ timeout: 10_000 });
  });
});
