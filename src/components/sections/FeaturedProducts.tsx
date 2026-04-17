import { Search } from 'lucide-react';
import { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getProductRoute, storefrontSectionRoutes } from '../../config/routes';
import { products } from '../../data/products';
import { useShop } from '../../context/ShopContext';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import type { CategorySlug, Product } from '../../types';
import ProductQuickViewModal from '../layout/ProductQuickViewModal';
import SectionHeading from '../ui/SectionHeading';
import ProductCard from '../ui/ProductCard';

interface QuickViewNavigationState {
  from?: string;
  preserveScroll?: boolean;
}

function FeaturedProducts() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const {
    categories,
    filteredProducts,
    searchQuery,
    activeCategory,
    weeklyDeal,
    isCatalogLoading,
    catalogStatusMessage,
    setSearchQuery,
    setActiveCategory,
    addToCart,
  } = useShop();
  const sectionReveal = useScrollReveal<HTMLElement>();
  const quickViewProduct = useMemo<Product | null>(
    () => products.find((product) => String(product.id) === id) ?? null,
    [id],
  );
  const closeRoute = useMemo(() => {
    const from = (location.state as QuickViewNavigationState | null)?.from;
    if (typeof from === 'string' && !from.startsWith('/product/')) {
      return from;
    }
    return storefrontSectionRoutes.shop;
  }, [location.state]);

  const filterOptions: CategorySlug[] = ['All', ...categories.map((category) => category.slug)];

  return (
    <section
      id="products"
      ref={sectionReveal.ref}
      data-reveal="true"
      data-revealed={sectionReveal.isRevealed}
      style={sectionReveal.style}
      className="section-shell pt-20"
    >
      <ProductQuickViewModal
        product={quickViewProduct}
        weeklyDeal={weeklyDeal}
        onClose={() =>
          navigate(closeRoute, {
            replace: true,
            state: {
              preserveScroll: true,
            } satisfies QuickViewNavigationState,
          })
        }
        onAddToCart={addToCart}
      />

      <div className="glass-panel rounded-[2rem] border border-white/10 px-6 py-8 sm:px-8 sm:py-10">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <SectionHeading
              eyebrow="Featured products"
              title="Shop the latest MechaShop picks with fast search, refined filters, and zero clutter."
              description="From flagship boards to finishing touches, every product card is tuned to surface the details shoppers actually compare before they add to cart."
            />

            <div className="w-full max-w-xl space-y-4">
              <label className="relative block">
                <span className="sr-only">Search products</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-300" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search boards, switches, keycaps, or accessories"
                  className="focus-ring w-full rounded-full border border-white/10 bg-white/[0.04] py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-500"
                />
              </label>

              <div className="flex flex-wrap gap-2" role="group" aria-label="Category filters">
                {filterOptions.map((option) => {
                  const isActive = option === activeCategory;

                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setActiveCategory(option)}
                      aria-pressed={isActive}
                      className={`focus-ring rounded-full border px-4 py-2 text-sm font-medium transition ${
                        isActive
                          ? 'border-transparent bg-gradient-to-r from-cyan-300 to-violet-400 text-slate-950'
                          : 'border-white/10 bg-white/[0.04] text-slate-200 hover:border-cyan-300/30 hover:bg-white/8'
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 text-sm text-slate-400">
            <p>
              Showing <span className="font-semibold text-white">{filteredProducts.length}</span>{' '}
              result{filteredProducts.length === 1 ? '' : 's'}
            </p>
            <p>Filter by collection, compare ratings, and add pieces without losing your place.</p>
          </div>

          {catalogStatusMessage ? (
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
              {catalogStatusMessage}
            </div>
          ) : null}

          {isCatalogLoading ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-live="polite" aria-busy="true">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  // eslint-disable-next-line react/no-array-index-key
                  key={`product-skeleton-${index}`}
                  className="animate-pulse rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5"
                >
                  <div className="h-44 rounded-xl bg-white/10" />
                  <div className="mt-4 h-4 w-2/3 rounded bg-white/10" />
                  <div className="mt-2 h-3 w-full rounded bg-white/10" />
                  <div className="mt-2 h-3 w-5/6 rounded bg-white/10" />
                  <div className="mt-5 h-10 w-1/2 rounded-full bg-white/10" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-[1.8rem] border border-dashed border-white/12 bg-white/[0.03] px-6 py-12 text-center">
              <h3 className="text-xl font-semibold text-white">No matching products</h3>
              <p className="mt-2 text-sm leading-7 text-slate-400">
                Try a broader search or switch back to a different category filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('All');
                }}
                className="focus-ring mt-5 rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-medium text-white"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  weeklyDeal={weeklyDeal}
                  onAddToCart={addToCart}
                  onQuickView={(selectedProduct) =>
                    navigate(getProductRoute(selectedProduct.id), {
                      state: {
                        from: location.pathname.startsWith('/product/')
                          ? storefrontSectionRoutes.shop
                          : location.pathname,
                        preserveScroll: true,
                      },
                    })
                  }
                  revealDelayMs={index * 70}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default FeaturedProducts;
