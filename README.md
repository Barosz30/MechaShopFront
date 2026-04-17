# MechaShopFrontendFinal

Polished React storefront demo with accessibility-first UX, route-aware quick view, promo pricing logic, local cart persistence, and automated tests.

## Tech Stack

- React 19 + TypeScript (strict)
- Vite 7 + Tailwind CSS v4
- React Router
- Vitest + Testing Library + coverage thresholds

## Getting Started

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` - start local dev server
- `npm run build` - typecheck and build production bundle
- `npm run test` - run tests in watch mode
- `npm run test:run` - run tests once with coverage

## Core Features

- Accessible dialogs (`CartDrawer`, `CheckoutModal`, `ProductQuickViewModal`) with focus trap, Escape close, and scroll lock
- Route-aware storefront sections (`/shop`, `/categories`, `/deals`, etc.)
- Product deep-link quick view via `/product/:id`
- Weekly deal cycle with consistent price lock behavior in cart/checkout
- Versioned local cart persistence and defensive storage restore
- Reduced-motion-aware animations and reveal effects
- Lightweight telemetry events via `window` `CustomEvent`

## Telemetry Event Contract

Events are dispatched as:

```ts
new CustomEvent('mechashop:telemetry', {
  detail: {
    eventName: 'add_to_cart' | 'open_quick_view' | 'checkout_start' | 'checkout_success' | 'checkout_error',
    payload: {
      route?: string,
      productId?: number,
      cartCount?: number,
      total?: number,
      reference?: string,
      errorMessage?: string,
    },
    timestamp: number,
  },
})
```

## Notes

- Checkout flow is mock-safe by design (frontend demo mode).
- Non-existent product deep links render an explicit product-not-found state.
# MechaShop Frontend Final

A merged best-of storefront built in `MechaShopFrontendFinal` using React, TypeScript, Vite, and Tailwind CSS v4.

## Highlights

- Claude 4.6 Opus-inspired structure with split `layout`, `sections`, and `ui` components
- Sticky accessible navbar with mobile menu, skip link, and live cart badge
- Hero with layered gradients, floating accents, and maintainable CSS-based motion
- Featured products grid with 12 image-backed products, search, and category filtering
- Categories, promo countdown, testimonials, FAQ, newsletter, and footer sections
- Cart drawer with `role="dialog"`, escape close, focus trap, and body scroll lock
- Free-shipping progress UX inside the cart flow
- Checkout modal with form fields, order summary, and mock completion state
- Responsive keyboard-friendly interactions with reduced-motion support

## Stack

- React 19
- TypeScript 5
- Vite 7
- Tailwind CSS v4 via `@tailwindcss/vite`
- Lucide React icons

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Project Structure

```text
MechaShopFrontendFinal/
  src/
    components/
      layout/
        CartDrawer.tsx
        CheckoutModal.tsx
        Footer.tsx
        Header.tsx
      sections/
        Categories.tsx
        DealsBanner.tsx
        FAQ.tsx
        FeaturedProducts.tsx
        Hero.tsx
        Newsletter.tsx
        Testimonials.tsx
      ui/
        ProductCard.tsx
        SectionHeading.tsx
        ShippingProgress.tsx
    context/
      ShopContext.tsx
    data/
      products.ts
      siteContent.ts
    hooks/
      useBodyScrollLock.ts
      useCountdown.ts
      useEscapeKey.ts
      useFocusTrap.ts
    App.tsx
    index.css
    main.tsx
    types.ts
  index.html
  package-lock.json
  package.json
  tsconfig.app.json
  tsconfig.json
  tsconfig.node.json
  vite.config.ts
```

## Notes

- The checkout flow is mock-only and does not connect to a payment provider.
- Product images are remote Unsplash assets referenced directly in the demo data.
- Verified with `npm run build`.
