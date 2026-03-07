import { test, expect } from '@playwright/test';

/** Sprawdzony 1x1 PNG – czarny piksel (ładuje się w przeglądarkach) */
const MINIMAL_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

/** Czeka na modal cropowania (po wyborze pliku obrazka). */
async function waitForCropModal(page: import('@playwright/test').Page) {
  await expect(page.locator('.crop-modal').filter({ hasText: 'Przytnij zdjęcie' })).toBeVisible({
    timeout: 15_000,
  });
}

/** Wybiera plik obrazka przez przycisk "Wybierz plik" (uruchamia file chooser). */
async function selectImageFile(page: import('@playwright/test').Page) {
  const buffer = Buffer.from(MINIMAL_PNG_BASE64, 'base64');
  const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5_000 });
  await page.getByRole('button', { name: 'Wybierz plik' }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles({
    name: 'test-image.png',
    mimeType: 'image/png',
    buffer,
  });
}

test.describe('Item create – crop zdjęcia', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/items/new', { waitUntil: 'networkidle' });
    await page.locator('app-item-create').first().waitFor({ state: 'visible', timeout: 10_000 });
    await page.getByRole('button', { name: 'Wybierz plik' }).waitFor({ state: 'visible', timeout: 5_000 });
  });

  test('po wyborze pliku obrazka pokazuje się modal cropowania', async ({ page }) => {
    await selectImageFile(page);

    await waitForCropModal(page);
    await expect(page.getByRole('button', { name: 'Zastosuj' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Anuluj' })).toBeVisible();
  });

  test('w modalu widać kształt (Prostokąt, Koło) i przyciski proporcji', async ({ page }) => {
    await selectImageFile(page);

    const dialog = page.locator('.crop-modal').filter({ hasText: 'Przytnij zdjęcie' });
    await waitForCropModal(page);

    await expect(dialog.getByText('Prostokąt')).toBeVisible();
    await expect(dialog.getByText('Koło')).toBeVisible();
    await expect(dialog.getByText('Dowolne')).toBeVisible();
    await expect(dialog.getByText('1:1')).toBeVisible();
    await expect(dialog.getByText('4:3')).toBeVisible();
    await expect(dialog.getByText('16:9')).toBeVisible();
  });

  test('screenshot modalu cropowania (desktop)', async ({ page }) => {
    await selectImageFile(page);
    await waitForCropModal(page);

    const dialog = page.locator('.crop-modal');
    await expect(dialog).toHaveScreenshot('item-create-crop-modal.png', {
      maxDiffPixelRatio: 0.03,
      timeout: 10_000,
    });
  });

  test('Anuluj zamyka modal i czyści wybór', async ({ page }) => {
    await selectImageFile(page);

    await waitForCropModal(page);
    await page.getByRole('button', { name: 'Anuluj' }).click();
    await expect(page.locator('.crop-modal')).not.toBeVisible();
    await expect(page.getByText('Nie wybrano pliku')).toBeVisible();
  });

  test('Zastosuj zamyka modal i ustawia nazwę pliku', async ({ page }) => {
    await selectImageFile(page);

    await waitForCropModal(page);
    await page.getByRole('button', { name: 'Zastosuj' }).click();
    await expect(page.locator('.crop-modal')).not.toBeVisible();
    await expect(page.getByText('test-image')).toBeVisible();
  });
});
