import { Page } from '@playwright/test';
import tickers from './data/tickers.json';
import balances from './data/balances.json';
import profiles from './data/profiles.json';
import identities from './data/identities.json';
import accounts from './data/accounts.json';
import orders from './data/orders.json';
import transfers from './data/transfers.json';
import fiatAccounts from './data/fiat-accounts.json';
import depositAddresses from './data/deposit-addresses.json';
import stablecoinConversions from './data/stablecoin-conversions.json';

/**
 * Default mock data map. Tests can override specific routes by calling
 * page.route() again after setupMockRoutes().
 */
const MOCK_ROUTES: Record<string, unknown> = {
  '/api/paxos/pricing*': tickers,
  '/api/paxos/market-data*': {
    last_price: '67523.45',
    open: '66800.00',
    high: '68100.00',
    low: '66500.00',
    volume: '12453.78',
    change_24h: '1.08',
  },
  '/api/paxos/balances*': balances,
  '/api/paxos/profiles': profiles,
  '/api/paxos/identities': identities,
  '/api/paxos/accounts': accounts,
  '/api/paxos/orders': orders,
  '/api/paxos/executions': { items: [] },
  '/api/paxos/transfers*': transfers,
  '/api/paxos/internal-transfers': { id: 'transfer-new', status: 'COMPLETED' },
  '/api/paxos/paxos-transfers': { id: 'transfer-ext', status: 'COMPLETED' },
  '/api/paxos/fiat-accounts': fiatAccounts,
  '/api/paxos/deposit-addresses': depositAddresses,
  '/api/paxos/fiat-deposit-instructions': { items: [] },
  '/api/paxos/stablecoin-conversions': stablecoinConversions,
  '/api/paxos/crypto-withdrawals': { id: 'withdrawal-001', status: 'PENDING', amount: '0.1', asset: 'BTC' },
  '/api/paxos/fiat-withdrawals': { id: 'fiat-withdrawal-001', status: 'PENDING', amount: '500.00' },
  '/api/paxos/crypto-destination-addresses': { items: [] },
  '/api/paxos/fees': { fee: '0.0001', amount: '0.0001', estimated_arrival: '~30 minutes' },
  '/api/paxos/quotes*': {
    id: 'quote-001',
    market: 'BTCUSD',
    side: 'BUY',
    amount: '1.0',
    price: '67525.00',
    expires_at: new Date(Date.now() + 30_000).toISOString(),
  },
  '/api/paxos/quote-executions': { id: 'exec-001', status: 'FILLED' },
  '/api/paxos/monitoring-addresses': { items: [] },
  '/api/paxos/sandbox-identity': { id: 'identity-001', status: 'APPROVED' },
  '/api/paxos/identity-documents': { items: [] },
  '/api/paxos/account-members*': { items: [] },
  '/api/paxos/events*': { items: [], next_page_cursor: null },
  '/api/paxos/orchestrations': { items: [] },
  '/api/paxos/orchestration-rules': { items: [] },
};

/**
 * Intercept all /api/paxos/* routes and return deterministic mock data.
 * Call this at the top of each test or in a beforeEach hook.
 *
 * For POST/PUT/DELETE requests, the handler returns the same mock data
 * with a 200 status (simulating success).
 */
export async function setupMockRoutes(page: Page) {
  for (const [pattern, data] of Object.entries(MOCK_ROUTES)) {
    await page.route(`**${pattern}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(data),
      });
    });
  }
}

/**
 * Override a specific mock route with custom data.
 * Must be called AFTER setupMockRoutes().
 */
export async function overrideMock(
  page: Page,
  urlPattern: string,
  data: unknown,
  status = 200,
) {
  await page.route(`**${urlPattern}`, async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(data),
    });
  });
}
