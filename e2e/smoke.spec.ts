import { expect, test } from '@playwright/test';

test.describe('Travel Buddy production smoke', () => {
  test('loads app shell and trip platform', async ({ page }) => {
    await page.goto('/#trip-platform');
    await expect(page.getByRole('region', { name: /trip platform/i })).toBeVisible();
    await expect(page.getByText(/Aleya Travel Assistant/i)).toBeVisible();
  });

  test('trip brief panel validates and generates a draft plan', async ({ page }) => {
    await page.goto('/#trip-platform');
    await page.getByRole('tab', { name: /^home$/i }).click();
    await page.getByRole('tab', { name: /trip brief/i }).click();

    await expect(page.getByText(/Trip brief → draft plan/i)).toBeVisible({ timeout: 15_000 });

    await page.locator('#brief-destination').fill('Lisbon');
    await page.locator('#brief-start').fill('2026-09-01');
    await page.locator('#brief-end').fill('2026-09-04');
    await page.locator('#brief-travelers').fill('2');
    await page.getByLabel('Food').check();
    await page.getByLabel('Culture').check();
    await page.getByRole('button', { name: /generate draft plan/i }).click();
    await expect(page.getByText(/day draft plan for Lisbon/i)).toBeVisible();
    await expect(page.getByText(/Suggested days/i)).toBeVisible();
  });

  test('auth panel exposes cloud or local status without crashing', async ({ page }) => {
    await page.goto('/#trip-platform');
    await page.getByRole('tab', { name: /^system$/i }).click();
    await page.getByRole('tab', { name: /^auth$/i }).click();
    await expect(page.getByText(/Authentication/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Mode:/i)).toBeVisible();
  });
});

