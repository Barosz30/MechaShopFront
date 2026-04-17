import { Check, ShoppingCart, Star, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  buildResponsiveImageUrl,
  buildResponsiveSrcSet,
  getProductPricing,
  productImageHeight,
  productImageWidth,
  quickViewImageSizes,
} from '../../data/products';
import { useLocale } from '../../context/LocaleContext';
import { useTelemetry } from '../../context/TelemetryContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { usePresence } from '../../hooks/usePresence';
import type { DealCycleState, Product } from '../../types';
import ResponsiveImage from '../ui/ResponsiveImage';

interface ProductQuickViewModalProps {
  product: Product | null;
  weeklyDeal: DealCycleState;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

function ProductQuickViewModal({
  product,
  weeklyDeal,
  onClose,
  onAddToCart,
}: ProductQuickViewModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const timeoutRef = useRef<number | null>(null);
  const [isAdded, setIsAdded] = useState(false);
  const [renderedProduct, setRenderedProduct] = useState<Product | null>(product);
  const { formatCurrency } = useLocale();
  const { track } = useTelemetry();
  const isOpen = Boolean(product);
  const { isMounted, isVisible } = usePresence(isOpen);

  useEffect(() => {
    if (product) {
      setRenderedProduct(product);
      setIsAdded(false);
      track('open_quick_view', {
        productId: product.id,
        route: typeof window === 'undefined' ? '/' : window.location.pathname,
      });
    }
  }, [product, track]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useBodyScrollLock(isMounted);
  useEscapeKey(isOpen, onClose);
  useFocusTrap(panelRef, isOpen, { initialFocusRef: closeButtonRef });

  if (!isMounted || !renderedProduct) {
    return null;
  }

  const pricing = getProductPricing(renderedProduct, weeklyDeal);
  const showOfferEndedBadge =
    weeklyDeal.phase === 'cooldown' && renderedProduct.promotion?.id === 'weekly-spotlight';

  const handleAddToCart = () => {
    onAddToCart(renderedProduct);
    setIsAdded(true);

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setIsAdded(false);
      timeoutRef.current = null;
    }, 1400);
  };

  const modalContent = (
    <div
      className={`fixed inset-0 z-[65] flex items-center justify-center p-4 ${isOpen ? '' : 'pointer-events-none'}`}
      aria-hidden={!isOpen}
      inert={!isOpen}
    >
      <button
        type="button"
        aria-label="Close quick view"
        data-state={isVisible ? 'open' : 'closed'}
        className="dialog-backdrop absolute inset-0 bg-slate-950/85 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-view-title"
        aria-describedby="quick-view-description"
        tabIndex={-1}
        data-state={isVisible ? 'open' : 'closed'}
        className="dialog-panel dialog-panel-modal relative z-10 grid max-h-[92vh] w-full max-w-6xl gap-6 overflow-y-auto rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(11,18,32,0.96),rgba(6,10,18,0.98))] p-5 shadow-2xl shadow-black/40 lg:grid-cols-[1.05fr_0.95fr] lg:p-8"
      >
        <div className="min-w-0 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-white/15 bg-slate-950/75 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                {renderedProduct.badge}
              </span>
              {pricing.promotionBadge ? (
                <span className="rounded-full border border-amber-300/25 bg-amber-300/12 px-3 py-1 text-xs font-semibold text-amber-100 backdrop-blur">
                  {pricing.discountPercent}% off spotlight
                </span>
              ) : null}
              {showOfferEndedBadge ? (
                <span className="rounded-full border border-white/12 bg-slate-950/70 px-3 py-1 text-xs font-semibold text-slate-200 backdrop-blur">
                  Offer ended
                </span>
              ) : null}
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200"
              aria-label="Close quick view"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="product-image-surface product-image-card relative overflow-hidden rounded-[1.75rem] border border-white/10">
            <ResponsiveImage
              src={buildResponsiveImageUrl(renderedProduct.image, 960)}
              srcSet={buildResponsiveSrcSet(renderedProduct.image, [720, 960, 1200])}
              sizes={quickViewImageSizes}
              alt={renderedProduct.name}
              fallbackLabel={renderedProduct.name}
              width={productImageWidth}
              height={productImageHeight}
              loading="lazy"
              decoding="async"
              className="product-image aspect-[4/3] h-full w-full object-cover"
            />
            <div className="product-image-overlay" aria-hidden="true" />
            <div
              className={`absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t ${renderedProduct.accent} opacity-35 blur-3xl`}
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-center justify-between gap-4 text-xs uppercase tracking-[0.28em] text-slate-400">
            <span>{renderedProduct.category}</span>
            <span className="flex items-center gap-1 text-amber-300">
              <Star className="h-3.5 w-3.5 fill-current" />
              {renderedProduct.rating.toFixed(1)}
            </span>
          </div>

          <h2 id="quick-view-title" className="mt-4 text-3xl font-semibold text-white">
            {renderedProduct.name}
          </h2>
          <p id="quick-view-description" className="mt-4 text-sm leading-7 text-slate-300">
            {renderedProduct.description}
          </p>

          <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Pricing</p>
            <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-2">
              <p className="text-3xl font-semibold text-white">
                {formatCurrency(pricing.currentPrice)}
              </p>
              {pricing.originalPrice !== undefined ? (
                <p className="text-base font-medium text-slate-400 line-through">
                  {formatCurrency(pricing.originalPrice)}
                </p>
              ) : null}
            </div>
            {pricing.promotionBadge ? (
              <p className="mt-2 text-sm text-amber-200">
                {pricing.promotionBadge} pricing locks in once this item is added to cart and
                remains through checkout for this session.
              </p>
            ) : showOfferEndedBadge ? (
              <p className="mt-2 text-sm text-slate-400">
                Spotlight pricing is no longer available for new adds. Items already in cart keep
                their locked price through checkout.
              </p>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-300">
                Key features
              </h3>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
                {renderedProduct.features.map((feature) => (
                  <li key={feature} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-cyan-300" aria-hidden="true" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-300">
                Specs
              </h3>
              <dl className="mt-4 space-y-3">
                {renderedProduct.specs.map((spec) => (
                  <div key={spec.label} className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3">
                    <dt className="text-xs uppercase tracking-[0.22em] text-slate-500">{spec.label}</dt>
                    <dd className="mt-1 text-sm font-medium text-white">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleAddToCart}
              aria-label={
                isAdded
                  ? `${renderedProduct.name} added to cart`
                  : `Add ${renderedProduct.name} to cart`
              }
              className={`focus-ring inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition active:scale-[0.98] ${
                isAdded
                  ? 'add-feedback-pop bg-emerald-400 text-slate-950 shadow-[0_10px_28px_rgba(52,211,153,0.28)]'
                  : 'bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950 hover:brightness-110'
              }`}
            >
              {isAdded ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
              {isAdded ? 'Added to cart' : 'Add to cart'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="focus-ring rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-100"
            >
              Continue browsing
            </button>
          </div>

          <span className="sr-only" aria-live="polite">
            {isAdded ? `${renderedProduct.name} added to cart.` : ''}
          </span>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return modalContent;
  }

  return createPortal(modalContent, document.body);
}

export default ProductQuickViewModal;
