import { test } from '@playwright/test';

const VIEWPORTS = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
} as const;

const THEMES = ['dark', 'light'] as const;

const ROUTES: { path: string; slug: string }[] = [
  { path: '/', slug: 'home' },
  { path: '/items', slug: 'items' },
  { path: '/items/new', slug: 'items-new' },
  { path: '/item/1', slug: 'item-1' },
  { path: '/cart', slug: 'cart' },
  { path: '/payment-success', slug: 'payment-success' },
  { path: '/payment-cancel', slug: 'payment-cancel' },
  { path: '/profile', slug: 'profile' },
];

/** Przykładowe pozycje do koszyka (zgodne z CartService + ShopItem), żeby screenshot koszyka miał zawartość */
const SAMPLE_CART = [
  {
    item: {
      id: 1,
      name: 'Śruba M8x40',
      price: 4,
      isAvailable: true,
      description: 'Stalowa śruba hex',
      imageUrl: null,
      category: null,
      details: null,
    },
    quantity: 3,
  },
  {
    item: {
      id: 2,
      name: 'Nakrętka M8',
      price: 2,
      isAvailable: true,
      description: null,
      imageUrl: null,
      category: null,
      details: null,
    },
    quantity: 10,
  },
];

for (const [viewportName, viewportSize] of Object.entries(VIEWPORTS)) {
  for (const theme of THEMES) {
    for (const { path, slug } of ROUTES) {
      test(`screenshot ${viewportName} ${theme} ${slug}`, async ({ page }) => {
        await page.setViewportSize(viewportSize);
        await page.addInitScript(
          (themeValue: string) => {
            localStorage.setItem('app-theme', themeValue);
            document.documentElement.setAttribute('data-theme', themeValue);
          },
          theme,
        );

        if (slug === 'cart') {
          // Najpierw ładujemy dowolną stronę, ustawiamy koszyk w localStorage, potem idziemy na /cart
          await page.goto('/', { waitUntil: 'networkidle' });
          await page.evaluate((cartJson: string) => {
            localStorage.setItem('cart', cartJson);
          }, JSON.stringify(SAMPLE_CART));
          await page.goto('/cart', { waitUntil: 'networkidle' });
        } else {
          await page.goto(path, { waitUntil: 'networkidle' });
        }

        await page.locator('app-header').first().waitFor({ state: 'visible', timeout: 10_000 });

        // Strona pojedynczego przedmiotu ładuje dane z API – czekamy na zakończenie (sukces lub błąd)
        if (path === '/item/1') {
          await page
            .locator(
              '.item-details-container .back-btn, .item-details-container .state-message.error',
            )
            .first()
            .waitFor({ state: 'visible', timeout: 20_000 });
        }

        const dir = `e2e-screenshots/${viewportName}-${viewportSize.width}x${viewportSize.height}/${theme}`;
        await page.screenshot({
          path: `${dir}/${slug}.png`,
          fullPage: true,
        });
      });
    }
  }
}

/** 1x1 PNG do otwarcia modalu cropowania na stronie items/new */
const CROP_TEST_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

// Podgląd modalu cropowania na stronie „Dodaj przedmiot” (desktop)
for (const theme of THEMES) {
  test(`screenshot desktop ${theme} items-new-crop-modal`, async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    await page.addInitScript(
      (themeValue: string) => {
        localStorage.setItem('app-theme', themeValue);
        document.documentElement.setAttribute('data-theme', themeValue);
      },
      theme,
    );
    await page.goto('/items/new', { waitUntil: 'networkidle' });
    await page.locator('app-item-create').first().waitFor({ state: 'visible', timeout: 10_000 });
    const buffer = Buffer.from(CROP_TEST_PNG_BASE64, 'base64');
    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 5_000 });
    await page.getByRole('button', { name: 'Wybierz plik' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({ name: 'test.png', mimeType: 'image/png', buffer });
    await page.locator('.crop-modal').filter({ hasText: 'Przytnij zdjęcie' }).waitFor({ state: 'visible', timeout: 15_000 });
    const dir = `e2e-screenshots/desktop-${VIEWPORTS.desktop.width}x${VIEWPORTS.desktop.height}/${theme}`;
    await page.screenshot({
      path: `${dir}/items-new-crop-modal.png`,
      fullPage: true,
    });
  });
}

// Podgląd otwartego burger menu – tylko na mobile (z przykładowym koszykiem w nagłówku)
const MOBILE_VIEWPORT = VIEWPORTS.mobile;
for (const theme of THEMES) {
  test(`screenshot mobile ${theme} burger-menu (open)`, async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.addInitScript(
      (themeValue: string) => {
        localStorage.setItem('app-theme', themeValue);
        document.documentElement.setAttribute('data-theme', themeValue);
      },
      theme,
    );
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.evaluate((cartJson: string) => {
      localStorage.setItem('cart', cartJson);
    }, JSON.stringify(SAMPLE_CART));
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.locator('app-header').first().waitFor({ state: 'visible', timeout: 10_000 });

    await page.getByRole('button', { name: 'Menu' }).click();
    await page.locator('.mobile-menu').waitFor({ state: 'visible', timeout: 5_000 });

    const dir = `e2e-screenshots/mobile-${MOBILE_VIEWPORT.width}x${MOBILE_VIEWPORT.height}/${theme}`;
    await page.screenshot({
      path: `${dir}/burger-menu.png`,
      fullPage: true,
    });
  });
}
