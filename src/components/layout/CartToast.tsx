import { CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocale } from '../../context/LocaleContext';
import { useShop } from '../../context/ShopContext';
import { usePresence } from '../../hooks/usePresence';
import { useReducedMotion } from '../../hooks/useReducedMotion';

function CartToast() {
  const { cartToast, dismissCartToast, openCart } = useShop();
  const { formatCurrency } = useLocale();
  const prefersReducedMotion = useReducedMotion();
  const { isMounted, isVisible } = usePresence(Boolean(cartToast), 220);
  const [renderedToast, setRenderedToast] = useState(cartToast);

  useEffect(() => {
    if (cartToast) {
      setRenderedToast(cartToast);
    }
  }, [cartToast]);

  useEffect(() => {
    if (!cartToast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      dismissCartToast();
    }, 3200);

    return () => window.clearTimeout(timeoutId);
  }, [cartToast, dismissCartToast]);

  const handleViewCart = () => {
    openCart();
    dismissCartToast();
  };

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 bottom-5 z-[70] flex justify-center px-4"
    >
      {isMounted && renderedToast ? (
        <div
          role="status"
          aria-label={`${renderedToast.name} added to cart`}
          data-state={isVisible ? 'open' : 'closed'}
          className={`toast-surface toast-panel pointer-events-auto flex max-w-lg items-center gap-3 rounded-[1.6rem] border border-white/12 px-4 py-3 text-sm text-slate-100 shadow-[0_18px_48px_rgba(2,6,23,0.45)] ${
            prefersReducedMotion ? '' : 'toast-enter'
          }`}
        >
          <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-400/15 text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="font-medium text-white">Added to cart</p>
            <p className="truncate text-slate-300">
              {renderedToast.name}
              {typeof renderedToast.price === 'number'
                ? ` · ${formatCurrency(renderedToast.price)}`
                : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={handleViewCart}
            aria-controls="cart-drawer"
            className="focus-ring ml-auto shrink-0 rounded-full border border-cyan-300/25 bg-cyan-300/12 px-3 py-2 text-xs font-semibold text-cyan-100 transition hover:border-cyan-200/40 hover:bg-cyan-300/18"
          >
            View cart
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default CartToast;
