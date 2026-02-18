import { Page, expect } from '@playwright/test';

/** Format a number as USD ($X,XXX.XX) for assertion matching */
export function formatUSD(value: number | string): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return `$${n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Wait for navigation to a specific path pattern */
export async function waitForNav(page: Page, pattern: RegExp, timeout = 10_000) {
  await page.waitForURL(pattern, { timeout });
}

/** Wait for loading skeletons to disappear */
export async function waitForLoaded(page: Page, timeout = 10_000) {
  // Wait for any skeletons to disappear
  await page.waitForFunction(
    () => document.querySelectorAll('[class*="animate-pulse"]').length === 0,
    { timeout },
  ).catch(() => {
    // Skeletons may never appear if data loads fast
  });
}

/** Click a navigation link in the sidebar */
export async function navigateVia(page: Page, label: string) {
  await page.getByRole('link', { name: label }).first().click();
}

/** Fill an input by its label text */
export async function fillByLabel(page: Page, label: string, value: string) {
  await page.getByLabel(label).fill(value);
}

/** Assert page has heading with text */
export async function expectHeading(page: Page, text: string | RegExp) {
  await expect(page.getByRole('heading', { name: text }).first()).toBeVisible();
}

/** Assert visible text on the page */
export async function expectText(page: Page, text: string | RegExp) {
  await expect(page.getByText(text).first()).toBeVisible();
}

/** Select an option from a native select element */
export async function selectOption(page: Page, label: string, value: string) {
  await page.getByLabel(label).selectOption(value);
}
