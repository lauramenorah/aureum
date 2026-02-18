import { test, expect } from '@playwright/test';
import { setupMockRoutes } from '../mocks/handlers';

const viewports = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
} as const;

test.describe('Responsive Layouts - Mobile', () => {
  test.use({ viewport: viewports.mobile });

  test.beforeEach(async ({ page }) => {
    await setupMockRoutes(page);
  });

  test('dashboard renders on mobile', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText('Portfolio Value')).toBeVisible({ timeout: 10_000 });
  });

  test('trade page renders on mobile', async ({ page }) => {
    await page.goto('/trade');
    await expect(page.getByText('Trade').first()).toBeVisible();
    await expect(page.getByText('BTC / USD').first()).toBeVisible({ timeout: 10_000 });
  });

  test('deposit page renders on mobile', async ({ page }) => {
    await page.goto('/deposit');
    await expect(page.getByText('Deposit Funds')).toBeVisible();
  });

  test('withdraw page renders on mobile', async ({ page }) => {
    await page.goto('/withdraw');
    await expect(page.getByText('Withdraw Funds')).toBeVisible();
  });

  test('convert page renders on mobile', async ({ page }) => {
    await page.goto('/convert');
    await expect(page.getByText('Convert').first()).toBeVisible();
  });

  test('history page renders on mobile', async ({ page }) => {
    await page.goto('/history');
    await expect(page.getByText('History')).toBeVisible();
  });

  test('market page renders on mobile', async ({ page }) => {
    await page.goto('/market');
    await expect(page.getByText('Market Overview')).toBeVisible();
  });

  test('sidebar is hidden on mobile', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('aside')).not.toBeVisible();
  });

  test('bottom nav is visible on mobile', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText('More').last()).toBeVisible();
  });
});

test.describe('Responsive Layouts - Tablet', () => {
  test.use({ viewport: viewports.tablet });

  test.beforeEach(async ({ page }) => {
    await setupMockRoutes(page);
  });

  test('dashboard renders on tablet', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByText('Portfolio Value')).toBeVisible({ timeout: 10_000 });
  });

  test('sidebar is visible on tablet (md breakpoint)', async ({ page }) => {
    await page.goto('/dashboard');
    // Sidebar shows at md breakpoint (768px)
    await expect(page.locator('aside')).toBeVisible();
    await expect(page.getByText('NeoBank')).toBeVisible();
  });

  test('trade page renders on tablet', async ({ page }) => {
    await page.goto('/trade');
    await expect(page.getByText('Trade').first()).toBeVisible();
  });
});

test.describe('Responsive Layouts - Desktop', () => {
  test.use({ viewport: viewports.desktop });

  test.beforeEach(async ({ page }) => {
    await setupMockRoutes(page);
  });

  test('dashboard renders with sidebar on desktop', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('aside')).toBeVisible();
    await expect(page.getByText('NeoBank')).toBeVisible();
    await expect(page.getByText('Portfolio Value')).toBeVisible({ timeout: 10_000 });
  });

  test('sidebar shows all navigation links', async ({ page }) => {
    await page.goto('/dashboard');
    const sidebar = page.locator('aside');

    await expect(sidebar.getByText('Dashboard')).toBeVisible();
    await expect(sidebar.getByText('Deposit')).toBeVisible();
    await expect(sidebar.getByText('Withdraw')).toBeVisible();
    await expect(sidebar.getByText('Trade')).toBeVisible();
    await expect(sidebar.getByText('Convert')).toBeVisible();
    await expect(sidebar.getByText('Transfer')).toBeVisible();
    await expect(sidebar.getByText('History')).toBeVisible();
    await expect(sidebar.getByText('Earn')).toBeVisible();
    await expect(sidebar.getByText('Market')).toBeVisible();
    await expect(sidebar.getByText('Accounts')).toBeVisible();
    await expect(sidebar.getByText('Profiles')).toBeVisible();
    await expect(sidebar.getByText('Settings')).toBeVisible();
  });

  test('sidebar navigation links work', async ({ page }) => {
    await page.goto('/dashboard');
    const sidebar = page.locator('aside');

    await sidebar.getByText('Market').click();
    await expect(page).toHaveURL(/\/market/);
    await expect(page.getByText('Market Overview')).toBeVisible();
  });

  test('bottom nav is hidden on desktop', async ({ page }) => {
    await page.goto('/dashboard');
    // Bottom nav has class md:hidden
    const bottomNav = page.locator('nav.fixed.bottom-0');
    await expect(bottomNav).not.toBeVisible();
  });

  test('trade page shows full layout on desktop', async ({ page }) => {
    await page.goto('/trade');
    await expect(page.getByText('Price Chart')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Order Book')).toBeVisible();
    await expect(page.getByText('Recent Trades')).toBeVisible();
  });
});
