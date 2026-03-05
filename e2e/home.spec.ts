import { test, expect } from '@playwright/test';

test('strona główna się ładuje i wygląda ok', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/ApkaTestowa/i);
});

