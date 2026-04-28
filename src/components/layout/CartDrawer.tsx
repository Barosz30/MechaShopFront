import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  buildResponsiveImageUrl,
  buildResponsiveSrcSet,
  cartItemImageSizes,
  freeShippingThreshold,
  productImageHeight,
  productImageWidth,
} from '../../data/products';
import { useLocale } from '../../context/LocaleContext';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { usePresence } from '../../hooks/usePresence';
import { useShop } from '../../context/ShopContext';
import { storefrontSectionRoutes } from '../../config/routes';
import ResponsiveImage from '../ui/ResponsiveImage';
import ShippingProgress from '../ui/ShippingProgress';

function CartDrawer() {
  const navigate = useNavigate();
  const drawerRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const {
    cartItems,
    cartCount,
    subtotal,
    shippingCost,
    total,
    freeShippingProgress,
    isCartOpen,
    isCheckoutOpen,
    closeCart,
    openCheckout,
    removeFromCart,
    updateQuantity,
  } = useShop();
  const { formatCurrency } = useLocale();
  const { isMounted, isVisible } = usePresence(isCartOpen);
  const hasLockedSpotlightPricing = cartItems.some(
    (item) => item.appliedPromotionId === 'weekly-spotlight',
  );

  useBodyScrollLock(isMounted);
  useEscapeKey(isCartOpen, closeCart);
  useFocusTrap(drawerRef, isCartOpen, {
    initialFocusRef: closeButtonRef,
    restoreFocus: !isCheckoutOpen,
  });

  if (!isMounted) {
    return null;
  }

  const handleContinueToCheckout = () => {
    if (cartItems.length === 0) {
      return;
    }

    openCheckout();
    navigate(storefrontSectionRoutes.checkout);
  };

  return (
    <div
      className={`fixed inset-0 z-50 ${isCartOpen ? '' : 'pointer-events-none'}`}
      aria-hidden={!isCartOpen}
      inert={!isCartOpen}
    >
      <button
        type="button"
        aria-label="Close cart overlay"
        data-state={isVisible ? 'open' : 'closed'}
        className="dialog-backdrop absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={closeCart}
      />

      <aside
        ref={drawerRef}
        id="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        tabIndex={-1}
        data-state={isVisible ? 'open' : 'closed'}
        className="dialog-panel dialog-panel-right absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-white/10 bg-slate-950/96 shadow-2xl shadow-black/40"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300/80">
              Cart drawer
            </p>
            <h2 id="cart-title" className="mt-2 text-2xl font-semibold text-white">
              Your build list
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {cartCount} {cartCount === 1 ? 'item' : 'items'} selected for your setup.
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeCart}
            className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200"
            aria-label="Close cart"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-white/10 px-5 py-4 sm:px-6">
          <ShippingProgress
            current={subtotal}
            threshold={freeShippingThreshold}
            progress={freeShippingProgress}
          />
          {hasLockedSpotlightPricing ? (
            <p className="mt-3 text-sm text-amber-100/85">
              Spotlight prices already in your cart are locked and will stay through checkout for
              this session.
            </p>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {cartItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center rounded-[1.8rem] border border-dashed border-white/12 bg-white/[0.03] px-6 py-12 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-3xl bg-white/5 text-slate-400">
                <ShoppingBag className="h-7 w-7" />
              </span>
              <h3 className="mt-5 text-xl font-semibold text-white">Your cart is empty</h3>
              <p className="mt-2 max-w-sm text-sm leading-7 text-slate-400">
                Add boards, switches, keycaps, or accessories to build a kit and unlock shipping
                perks.
              </p>
              <button
                type="button"
                onClick={closeCart}
                className="focus-ring mt-5 rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 px-5 py-3 text-sm font-semibold text-slate-950"
              >
                Continue browsing
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {cartItems.map((item) => (
                <li
                  key={item.id}
                  className="glass-panel overflow-hidden rounded-[1.6rem] border border-white/10 p-4"
                >
                  <div className="flex gap-4">
                    <div className="product-image-surface product-thumb-frame relative h-24 w-24 overflow-hidden rounded-[1.25rem]">
                      <ResponsiveImage
                        src={buildResponsiveImageUrl(item.image, 192)}
                        srcSet={buildResponsiveSrcSet(item.image, [192, 384])}
                        sizes={cartItemImageSizes}
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
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs uppercase tracking-[0.26em] text-cyan-300/80">
                            {item.category}
                          </p>
                          <h3 className="mt-1 truncate text-lg font-semibold text-white">
                            {item.name}
                          </h3>
                          <p className="mt-1 text-sm text-slate-400">{item.badge}</p>
                          {item.appliedPromotionId === 'weekly-spotlight' ? (
                            <p className="mt-2 text-xs font-medium text-amber-200">
                              Spotlight price locked in cart
                            </p>
                          ) : null}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-white">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                          {typeof item.originalPrice === 'number' ? (
                            <p className="text-xs text-slate-400 line-through">
                              {formatCurrency(item.originalPrice * item.quantity)}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="inline-flex items-center rounded-full border border-white/10 bg-slate-950/80 p-1">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-200"
                            aria-label={`Decrease quantity of ${item.name}`}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span
                            className="min-w-10 text-center text-sm font-semibold text-white"
                            aria-label={`${item.quantity} in cart`}
                          >
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-200"
                            aria-label={`Increase quantity of ${item.name}`}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="focus-ring inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-sm font-medium text-rose-200"
                          aria-label={`Remove ${item.name} from cart`}
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-white/10 bg-slate-950/98 px-5 py-5 sm:px-6">
          <div className="space-y-2 text-sm text-slate-300">
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
            <div className="flex items-center justify-between border-t border-white/10 pt-3 text-base">
              <span className="font-medium text-white">Order total</span>
              <span className="text-xl font-semibold text-white">{formatCurrency(total)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleContinueToCheckout}
            disabled={cartItems.length === 0}
            className="focus-ring mt-5 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 px-5 py-3.5 text-sm font-semibold text-slate-950 transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue to checkout
          </button>
          {hasLockedSpotlightPricing ? (
            <p className="mt-3 text-xs leading-6 text-slate-400">
              Locked spotlight prices are reflected above and carry into checkout without changing.
            </p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

export default CartDrawer;
