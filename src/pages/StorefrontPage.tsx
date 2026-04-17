import { lazy, Suspense, useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { storefrontSectionTargets } from '../config/routes';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { useShop } from '../context/ShopContext';
import Hero from '../components/sections/Hero';
import FeaturedProducts from '../components/sections/FeaturedProducts';

const Categories = lazy(() => import('../components/sections/Categories'));
const DealsBanner = lazy(() => import('../components/sections/DealsBanner'));
const Testimonials = lazy(() => import('../components/sections/Testimonials'));
const FAQ = lazy(() => import('../components/sections/FAQ'));
const Newsletter = lazy(() => import('../components/sections/Newsletter'));

function SectionFallback() {
  return (
    <section className="section-shell pt-20" aria-busy="true">
      <div className="glass-panel rounded-[2rem] border border-white/10 px-6 py-10 sm:px-8 sm:py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-40 rounded bg-white/10" />
          <div className="h-8 w-3/4 rounded bg-white/10" />
          <div className="h-4 w-full rounded bg-white/10" />
          <div className="h-4 w-5/6 rounded bg-white/10" />
        </div>
      </div>
    </section>
  );
}

const pageMetaByPath: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'MechaShop | Curated Keyboard Storefront',
    description:
      'Shop curated keyboards, switches, keycaps, deskmats, and accessories with accessible browsing, promo pricing, and a polished checkout flow.',
  },
  '/shop': {
    title: 'Shop | MechaShop',
    description:
      'Browse featured MechaShop products with quick filters, promo pricing, and quick-view deep links.',
  },
  '/categories': {
    title: 'Categories | MechaShop',
    description:
      'Explore keyboards, switches, keycaps, deskmats, and accessories by collection.',
  },
  '/deals': {
    title: 'Weekly Deals | MechaShop',
    description:
      'Track the current weekly spotlight countdown and lock promo pricing before the next cycle changes.',
  },
  '/reviews': {
    title: 'Reviews | MechaShop',
    description:
      'Read recent shopper feedback on MechaShop boards, accessories, and the end-to-end storefront flow.',
  },
  '/faq': {
    title: 'FAQ | MechaShop',
    description:
      'Find shipping, stock, pricing lock, and support answers before you check out.',
  },
  '/newsletter': {
    title: 'Newsletter | MechaShop',
    description:
      'Join the MechaShop drop list for restocks, bundle alerts, and subscriber-first updates.',
  },
};

function StorefrontPage() {
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { products } = useShop();
  const prefersReducedMotion = useReducedMotion();
  const product = id ? products.find((item) => String(item.id) === id) : undefined;
  const isInvalidProductRoute = Boolean(id) && !product;
  const metaConfig = product
    ? {
        title: `${product.name} | MechaShop`,
        description: product.description,
      }
    : isInvalidProductRoute
      ? {
          title: 'Product Not Found | MechaShop',
          description:
            'The requested product link is not available. Browse the storefront to continue shopping.',
        }
    : (pageMetaByPath[location.pathname] ?? pageMetaByPath['/'])!;

  useDocumentMeta(metaConfig);

  useEffect(() => {
    const shouldPreserveScroll = Boolean(
      (location.state as { preserveScroll?: boolean } | null)?.preserveScroll,
    );

    if (shouldPreserveScroll) {
      return;
    }

    if (location.pathname.startsWith('/product/')) {
      // Keep current scroll position when opening quick view routes.
      return;
    }

    const sectionId = storefrontSectionTargets[location.pathname as keyof typeof storefrontSectionTargets];

    if (!sectionId) {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      return;
    }

    const targetElement = document.getElementById(sectionId);

    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
      targetElement.setAttribute('tabindex', '-1');
      targetElement.focus({ preventScroll: true });
    }
  }, [location.pathname, location.state, prefersReducedMotion]);

  if (isInvalidProductRoute) {
    return (
      <main id="main-content" className="section-shell pb-16 pt-24">
        <section
          className="glass-panel mx-auto max-w-3xl rounded-[2rem] border border-white/10 px-6 py-10 text-center sm:px-10"
          aria-labelledby="product-not-found-title"
        >
          <p className="text-xs uppercase tracking-[0.32em] text-cyan-300/80">Product route</p>
          <h1 id="product-not-found-title" className="mt-3 text-3xl font-semibold text-white">
            Product not found
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            This product link is no longer available. Browse the shop to open a valid quick view
            route.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              to="/shop"
              className="focus-ring rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 px-5 py-3 text-sm font-semibold text-slate-950"
            >
              Go to shop
            </Link>
            <Link
              to="/"
              className="focus-ring rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-slate-100"
            >
              Back to homepage
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main id="main-content" className="pb-16">
      <Hero />
      <FeaturedProducts />
      <Suspense fallback={<SectionFallback />}>
        <Categories />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <DealsBanner />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <Testimonials />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <FAQ />
      </Suspense>
      <Suspense fallback={<SectionFallback />}>
        <Newsletter />
      </Suspense>
    </main>
  );
}

export default StorefrontPage;
