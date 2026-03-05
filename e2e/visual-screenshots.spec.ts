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
        await page.goto(path, { waitUntil: 'networkidle' });
        await page.locator('app-header').first().waitFor({ state: 'visible', timeout: 10_000 });
        const dir = `e2e-screenshots/${viewportName}-${viewportSize.width}x${viewportSize.height}/${theme}`;
        await page.screenshot({
          path: `${dir}/${slug}.png`,
          fullPage: true,
        });
      });
    }
  }
}
