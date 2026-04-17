import { Check, Eye, ShoppingCart, Star } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { DealCycleState, Product } from '../../types';
import {
  buildResponsiveImageUrl,
  buildResponsiveSrcSet,
  getProductPricing,
  productCardImageSizes,
  productImageHeight,
  productImageWidth,
} from '../../data/products';
import { useLocale } from '../../context/LocaleContext';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import ResponsiveImage from './ResponsiveImage';

interface ProductCardProps {
  product: Product;
  weeklyDeal: DealCycleState;
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
  revealDelayMs?: number;
}

function ProductCard({
  product,
  weeklyDeal,
  onAddToCart,
  onQuickView,
  revealDelayMs = 0,
}: ProductCardProps) {
  const [isAdded, setIsAdded] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const reveal = useScrollReveal<HTMLElement>({ delayMs: revealDelayMs, threshold: 0.16 });
  const pricing = getProductPricing(product, weeklyDeal);
  const { formatCurrency } = useLocale();
  const imageSrc = buildResponsiveImageUrl(product.image, 720);
  const imageSrcSet = buildResponsiveSrcSet(product.image, [480, 720, 960]);
  const showOfferEndedBadge =
    weeklyDeal.phase === 'cooldown' && product.promotion?.id === 'weekly-spotlight';

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleAddToCart = () => {
    onAddToCart(product);
    setIsAdded(true);

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setIsAdded(false);
      timeoutRef.current = null;
    }, 1400);
  };

  return (
    <article
      ref={reveal.ref}
      data-reveal="true"
      data-revealed={reveal.isRevealed}
      style={reveal.style}
      className="group glass-panel overflow-hidden rounded-[1.75rem] transition duration-300 hover:-translate-y-1 hover:border-cyan-300/30"
    >
      <div className="product-image-surface product-image-card relative aspect-[4/3] overflow-hidden">
        <ResponsiveImage
          src={imageSrc}
          srcSet={imageSrcSet}
          sizes={productCardImageSizes}
          alt={product.name}
          fallbackLabel={product.name}
          width={productImageWidth}
          height={productImageHeight}
          loading="lazy"
          decoding="async"
          className="product-image h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="product-image-overlay" aria-hidden="true" />
        <div className={`absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t ${product.accent} opacity-35 blur-2xl`} />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/15 bg-slate-950/75 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
            {product.badge}
          </span>
          {pricing.promotionBadge ? (
            <span className="rounded-full border border-amber-300/25 bg-amber-300/12 px-3 py-1 text-xs font-semibold text-amber-100 backdrop-blur">
              {pricing.discountPercent}% off
            </span>
          ) : null}
          {showOfferEndedBadge ? (
            <span className="rounded-full border border-white/12 bg-slate-950/70 px-3 py-1 text-xs font-semibold text-slate-200 backdrop-blur">
              Offer ended
            </span>
          ) : null}
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.28em] text-slate-400">
          <span>{product.category}</span>
          <span className="flex items-center gap-1 text-amber-300">
            <Star className="h-3.5 w-3.5 fill-current" />
            {product.rating.toFixed(1)}
          </span>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-white">{product.name}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">{product.blurb}</p>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Price</p>
            <div className="mt-1 flex flex-wrap items-end gap-x-3 gap-y-1">
              <p className="text-2xl font-semibold text-white">
                {formatCurrency(pricing.currentPrice)}
              </p>
              {pricing.originalPrice !== undefined ? (
                <p className="text-sm font-medium text-slate-400 line-through">
                  {formatCurrency(pricing.originalPrice)}
                </p>
              ) : null}
            </div>
            {pricing.promotionBadge ? (
              <p className="mt-1 text-sm text-amber-200">
                Add before the timer ends to lock this spotlight price in cart and checkout.
              </p>
            ) : showOfferEndedBadge ? (
              <p className="mt-1 text-sm text-slate-400">
                Spotlight pricing has ended for new adds. Items already in cart keep their locked
                price.
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => onQuickView(product)}
              className="focus-ring inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-medium text-slate-100 transition hover:border-cyan-300/30 hover:bg-white/10"
              aria-label={`Open quick view for ${product.name}`}
            >
              <Eye className="h-4 w-4" />
              Quick view
            </button>
            <button
              type="button"
              onClick={handleAddToCart}
              aria-label={isAdded ? `${product.name} added to cart` : `Add ${product.name} to cart`}
              className={`focus-ring inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition active:scale-[0.98] ${
                isAdded
                  ? 'add-feedback-pop bg-emerald-400 text-slate-950 shadow-[0_10px_28px_rgba(52,211,153,0.28)]'
                  : 'bg-gradient-to-r from-cyan-400 to-violet-500 text-slate-950 hover:brightness-110'
              }`}
            >
              {isAdded ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
              {isAdded ? 'Added' : 'Add'}
            </button>
          </div>
        </div>
        <span className="sr-only" aria-live="polite">
          {isAdded ? `${product.name} added to cart.` : ''}
        </span>
      </div>
    </article>
  );
}

export default ProductCard;
