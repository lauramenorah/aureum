import { test as base, expect } from '@playwright/test';
import { setupMockRoutes } from '../mocks/handlers';

/**
 * Authenticated page fixture that sets up API mocks for all /api/paxos/* routes.
 * Tests using this fixture get a pre-authenticated browser context with
 * deterministic mock data.
 */
export const test = base.extend<{ mockPage: typeof base }>({});

/**
 * Helper to create an authenticated test with all API routes mocked.
 * Usage:
 *   import { test, expect } from '../fixtures/auth.fixture';
 *   test('my test', async ({ page }) => {
 *     await setupMockRoutes(page);
 *     await page.goto('/dashboard');
 *     ...
 *   });
 */
export { expect, setupMockRoutes };
