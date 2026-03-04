import { test, expect } from '@playwright/test';

test('strona główna się ładuje i wygląda ok', async ({ page }) => {
  await page.goto('/');

  // Przykład: sprawdzenie tytułu strony / elementu głównego
  await expect(page).toHaveTitle(/ApkaTestowa/i);

  // Zrób pełny screenshot strony głównej, żeby można go było potem obejrzeć
  await page.screenshot({
    path: 'e2e-screenshots/home-page.png',
    fullPage: true,
  });
});

