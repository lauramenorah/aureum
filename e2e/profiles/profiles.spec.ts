import { test, expect } from '@playwright/test';
import { setupMockRoutes, overrideMock } from '../mocks/handlers';

test.describe('Profiles Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockRoutes(page);
    await page.goto('/profiles');
  });

  test('displays page title', async ({ page }) => {
    await expect(page.getByText('Profiles')).toBeVisible();
  });

  test('displays description text', async ({ page }) => {
    await expect(page.getByText(/Manage your profiles/i)).toBeVisible();
  });

  test('displays New Profile button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /New Profile/i })).toBeVisible();
  });

  test('shows profiles from mock data', async ({ page }) => {
    // profiles.json has Main Profile and Trading Profile
    await expect(page.getByText('Main Profile').first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Trading Profile').first()).toBeVisible();
  });

  test('first profile shows Default badge', async ({ page }) => {
    await expect(page.getByText('Default').first()).toBeVisible({ timeout: 10_000 });
  });

  test('profile card shows View Balances button', async ({ page }) => {
    await expect(page.getByText('View Balances').first()).toBeVisible({ timeout: 10_000 });
  });

  test('clicking View Balances expands balance breakdown', async ({ page }) => {
    await expect(page.getByText('View Balances').first()).toBeVisible({ timeout: 10_000 });
    await page.getByText('View Balances').first().click();

    // Should show balance details from mock
    await expect(page.getByText('Hide Balances').first()).toBeVisible({ timeout: 5_000 });
  });

  test('profile card shows Deactivate option', async ({ page }) => {
    await expect(page.getByText('Deactivate').first()).toBeVisible({ timeout: 10_000 });
  });

  test('clicking Deactivate opens confirmation modal', async ({ page }) => {
    await expect(page.getByText('Deactivate').first()).toBeVisible({ timeout: 10_000 });
    // The second profile (non-default) should have deactivate
    await page.getByText('Deactivate').first().click();

    await expect(page.getByText('Deactivate Profile')).toBeVisible();
    await expect(page.getByText('Are you sure?')).toBeVisible();
  });

  test('deactivate modal has Keep Active and Deactivate buttons', async ({ page }) => {
    await expect(page.getByText('Deactivate').first()).toBeVisible({ timeout: 10_000 });
    await page.getByText('Deactivate').first().click();

    await expect(page.getByRole('button', { name: 'Keep Active' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Deactivate/ }).last()).toBeVisible();
  });

  test('clicking New Profile opens create modal', async ({ page }) => {
    await page.getByRole('button', { name: /New Profile/i }).click();

    await expect(page.getByText('Create New Profile')).toBeVisible();
    await expect(page.getByLabel('Nickname')).toBeVisible();
  });

  test('create modal has Cancel and Create buttons', async ({ page }) => {
    await page.getByRole('button', { name: /New Profile/i }).click();

    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Profile' })).toBeVisible();
  });

  test('Create Profile button is disabled without nickname', async ({ page }) => {
    await page.getByRole('button', { name: /New Profile/i }).click();
    await expect(page.getByRole('button', { name: 'Create Profile' })).toBeDisabled();
  });

  test('entering nickname enables Create Profile button', async ({ page }) => {
    await page.getByRole('button', { name: /New Profile/i }).click();
    await page.getByLabel('Nickname').fill('Test Profile');
    await expect(page.getByRole('button', { name: 'Create Profile' })).toBeEnabled();
  });

  test('empty state shows when no profiles', async ({ page }) => {
    await overrideMock(page, '/api/paxos/profiles', { items: [] });
    await page.goto('/profiles');

    await expect(page.getByText('No profiles yet')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Create your first profile')).toBeVisible();
  });
});
