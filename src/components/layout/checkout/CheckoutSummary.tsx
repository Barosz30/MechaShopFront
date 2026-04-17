import { ShieldCheck } from 'lucide-react';
import {
  buildResponsiveImageUrl,
  buildResponsiveSrcSet,
  checkoutItemImageSizes,
  productImageHeight,
  productImageWidth,
} from '../../../data/products';
import { useLocale } from '../../../context/LocaleContext';
import type { CartItem } from '../../../types';
import ResponsiveImage from '../../ui/ResponsiveImage';

interface CheckoutSummaryProps {
  cartItems: CartItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  hasLockedSpotlightPricing: boolean;
}

function CheckoutSummary({
  cartItems,
  subtotal,
  shippingCost,
  total,
  hasLockedSpotlightPricing,
}: CheckoutSummaryProps) {
  const { formatCurrency } = useLocale();

  return (
    <aside className="glass-panel rounded-[1.8rem] border border-white/10 p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-400/12 text-cyan-300">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-lg font-semibold text-white">Order summary</h3>
          <p className="text-sm text-slate-400">
            Review your selections before submitting the order.
          </p>
        </div>
      </div>

      {hasLockedSpotlightPricing ? (
        <p className="mt-4 rounded-[1.2rem] border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
          Spotlight prices shown below are already locked from the cart and will not change during
          this checkout session.
        </p>
      ) : null}

      <ul className="mt-6 space-y-3">
        {cartItems.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-3 rounded-[1.2rem] border border-white/8 bg-white/[0.03] p-3"
          >
            <div className="product-image-surface product-thumb-frame relative h-16 w-16 overflow-hidden rounded-[1rem]">
              <ResponsiveImage
                src={buildResponsiveImageUrl(item.image, 128)}
                srcSet={buildResponsiveSrcSet(item.image, [128, 256])}
                sizes={checkoutItemImageSizes}
                alt={item.name}
                fallbackLabel={item.name}
                width={productImageWidth}
                height={productImageHeight}
                loading="lazy"
                decoding="async"
                className="product-image h-full w-full object-cover"
              />
              <div className="product-image-overlay" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-white">{item.name}</p>
              <p className="mt-1 text-sm text-slate-400">
                {item.quantity} x {formatCurrency(item.price)}
              </p>
              {item.appliedPromotionId === 'weekly-spotlight' ? (
                <p className="mt-1 text-xs font-medium text-amber-200">Spotlight price locked</p>
              ) : null}
            </div>
            <p className="text-sm font-semibold text-white">
              {formatCurrency(item.price * item.quantity)}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-6 space-y-3 border-t border-white/10 pt-5 text-sm text-slate-300">
        <div className="flex items-center justify-between">
          <span>Subtotal</span>
          <span className="font-semibold text-white">{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Shipping</span>
          <span className="font-semibold text-white">
            {shippingCost === 0 ? 'Free' : formatCurrency(shippingCost)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Insured shipping</span>
          <span className="font-semibold text-white">Included</span>
        </div>
        <div className="flex items-center justify-between border-t border-white/10 pt-4 text-base">
          <span className="font-medium text-white">Total</span>
          <span className="text-2xl font-semibold text-white">{formatCurrency(total)}</span>
        </div>
      </div>
    </aside>
  );
}

export default CheckoutSummary;
