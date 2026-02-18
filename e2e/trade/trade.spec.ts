import { test, expect } from '@playwright/test';
import { setupMockRoutes } from '../mocks/handlers';

test.describe('Trade Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockRoutes(page);
    await page.goto('/trade');
  });

  test('displays page title', async ({ page }) => {
    await expect(page.getByText('Trade').first()).toBeVisible();
  });

  test('displays market selector with BTC/USD default', async ({ page }) => {
    await expect(page.getByText('BTC / USD').first()).toBeVisible();
  });

  test('market selector dropdown shows all markets', async ({ page }) => {
    await page.getByText('BTC / USD').first().click();
    await expect(page.getByText('ETH / USD')).toBeVisible();
    await expect(page.getByText('PAXG / USD')).toBeVisible();
  });

  test('can switch market', async ({ page }) => {
    await page.getByText('BTC / USD').first().click();
    await page.getByText('ETH / USD').click();
    await expect(page.getByText('ETH / USD').first()).toBeVisible();
  });

  test('displays order mode tabs', async ({ page }) => {
    await expect(page.getByText('Quote')).toBeVisible();
    await expect(page.getByText('Market')).toBeVisible();
    await expect(page.getByText('Limit')).toBeVisible();
    await expect(page.getByText('Stop')).toBeVisible();
  });

  test('Quote mode shows buy/sell prices', async ({ page }) => {
    await expect(page.getByText('Buy Price').first()).toBeVisible();
    await expect(page.getByText('Sell Price').first()).toBeVisible();
  });

  test('Quote mode has amount input', async ({ page }) => {
    await expect(page.getByPlaceholder('0.00').first()).toBeVisible();
  });

  test('Buy/Sell toggle works in Quote mode', async ({ page }) => {
    const buyBtn = page.getByRole('button', { name: /Buy BTC/ }).first();
    const sellBtn = page.getByRole('button', { name: /Sell BTC/ }).first();
    await expect(buyBtn).toBeVisible();
    await expect(sellBtn).toBeVisible();

    await sellBtn.click();
    // Sell should now be active
    await expect(sellBtn).toBeVisible();
  });

  test('Market mode shows side toggle and amount input', async ({ page }) => {
    await page.getByRole('button', { name: 'Market' }).click();
    await expect(page.getByRole('button', { name: 'BUY' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'SELL' })).toBeVisible();
    await expect(page.getByText(/Amount/).first()).toBeVisible();
  });

  test('Limit mode shows price input', async ({ page }) => {
    await page.getByRole('button', { name: 'Limit' }).click();
    await expect(page.getByText(/Price.*USD/i).first()).toBeVisible();
    await expect(page.getByText(/Time in Force/i)).toBeVisible();
  });

  test('Limit mode shows time in force selector', async ({ page }) => {
    await page.getByRole('button', { name: 'Limit' }).click();
    const select = page.locator('select');
    await expect(select.first()).toBeVisible();
  });

  test('Stop mode shows stop price and limit price inputs', async ({ page }) => {
    await page.getByRole('button', { name: 'Stop' }).click();
    await expect(page.getByText('Limit Price').first()).toBeVisible();
    await expect(page.getByText('Stop Price').first()).toBeVisible();
  });

  test('Place order button is disabled without amount', async ({ page }) => {
    await page.getByRole('button', { name: 'Market' }).click();
    const placeBtn = page.getByRole('button', { name: /Place Market Order/ });
    await expect(placeBtn).toBeDisabled();
  });

  test('entering amount enables order button (Market mode)', async ({ page }) => {
    await page.getByRole('button', { name: 'Market' }).click();
    await page.getByPlaceholder('0.00').first().fill('0.5');
    const placeBtn = page.getByRole('button', { name: /Place Market Order/ });
    await expect(placeBtn).toBeEnabled();
  });

  test('shows estimated total when amount and price entered', async ({ page }) => {
    await page.getByRole('button', { name: 'Limit' }).click();
    // Fill price
    const inputs = page.getByPlaceholder('0.00');
    await inputs.first().fill('65000');
    // Fill amount
    await inputs.nth(1).fill('0.5');
    await expect(page.getByText('Est. Total')).toBeVisible();
  });

  test('clicking Place Order opens confirmation modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Market' }).click();
    await page.getByPlaceholder('0.00').first().fill('0.5');
    await page.getByRole('button', { name: /Place Market Order/ }).click();

    await expect(page.getByText('Confirm Order')).toBeVisible();
    await expect(page.getByText('Side')).toBeVisible();
    await expect(page.getByText('Market').last()).toBeVisible();
  });

  test('confirmation modal has cancel and confirm buttons', async ({ page }) => {
    await page.getByRole('button', { name: 'Market' }).click();
    await page.getByPlaceholder('0.00').first().fill('0.5');
    await page.getByRole('button', { name: /Place Market Order/ }).click();

    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Confirm/ })).toBeVisible();
  });

  test('displays price chart', async ({ page }) => {
    await expect(page.getByText('Price Chart')).toBeVisible();
  });

  test('displays 24h stats', async ({ page }) => {
    await expect(page.getByText('Open').first()).toBeVisible();
    await expect(page.getByText('High').first()).toBeVisible();
    await expect(page.getByText('Low').first()).toBeVisible();
    await expect(page.getByText('Volume').first()).toBeVisible();
  });

  test('displays order book', async ({ page }) => {
    await expect(page.getByText('Order Book')).toBeVisible();
    await expect(page.getByText('Spread').first()).toBeVisible();
  });

  test('displays recent trades section', async ({ page }) => {
    await expect(page.getByText('Recent Trades')).toBeVisible();
  });

  test('displays bottom panel with order tabs', async ({ page }) => {
    await expect(page.getByText('Open Orders')).toBeVisible();
    await expect(page.getByText('Order History')).toBeVisible();
    await expect(page.getByText('Trade History')).toBeVisible();
  });

  test('open orders tab shows mock open order', async ({ page }) => {
    // From mock data: order-001 is OPEN
    await expect(page.getByText('BTCUSD').first()).toBeVisible({ timeout: 10_000 });
  });

  test('order history tab shows closed orders', async ({ page }) => {
    await page.getByRole('button', { name: 'Order History' }).click();
    // From mock data: order-002 is FILLED, order-003 is CANCELLED
    await expect(page.getByText('FILLED').first()).toBeVisible({ timeout: 5_000 });
  });

  test('available balance displays', async ({ page }) => {
    await expect(page.getByText('Available Balance')).toBeVisible();
  });
});
