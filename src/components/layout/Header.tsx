import { Menu, Search, ShoppingCart, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { storefrontSectionRoutes } from '../../config/routes';
import { navLinks } from '../../data/siteContent';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useShop } from '../../context/ShopContext';
import { useAuth } from '../../context/AuthContext';

function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCartBadgePulsing, setIsCartBadgePulsing] = useState(false);
  const [cartBadgePulseKey, setCartBadgePulseKey] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousCartCountRef = useRef(0);
  const location = useLocation();
  const { cartCount, openCart } = useShop();
  const { isAuthenticated, user } = useAuth();
  const isMobileMenuMounted = isMobileMenuOpen;
  const isMobileMenuVisible = isMobileMenuOpen;
  const openMobileMenu = () => setIsMobileMenuOpen(true);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  useBodyScrollLock(isMobileMenuMounted);
  useEscapeKey(isMobileMenuOpen, closeMobileMenu);
  useFocusTrap(menuRef, isMobileMenuOpen, { initialFocusRef: closeButtonRef });

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 16);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    closeMobileMenu();
  }, [location.pathname]);

  useEffect(() => {
    if (cartCount > previousCartCountRef.current) {
      setCartBadgePulseKey((current) => current + 1);
      setIsCartBadgePulsing(true);

      const timeoutId = window.setTimeout(() => {
        setIsCartBadgePulsing(false);
      }, 420);

      previousCartCountRef.current = cartCount;
      return () => window.clearTimeout(timeoutId);
    }

    previousCartCountRef.current = cartCount;
  }, [cartCount]);

  return (
    <>
      <header className="sticky top-0 z-40">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-cyan-300 focus:px-4 focus:py-2 focus:text-slate-950"
        >
          Skip to content
        </a>

        <div
          className={`mx-auto mt-3 w-[min(100%-1rem,80rem)] rounded-[1.6rem] border px-4 py-3 transition duration-300 sm:px-6 ${
            isScrolled
              ? 'border-white/10 bg-slate-950/80 shadow-[0_20px_60px_rgba(0,0,0,0.32)] backdrop-blur-xl'
              : 'border-white/8 bg-slate-950/45 backdrop-blur-md'
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <Link
              to={storefrontSectionRoutes.home}
              className="focus-ring flex min-w-0 items-center gap-3 rounded-full"
              aria-label="MechaShop home"
            >
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 via-sky-400 to-violet-500 text-slate-950 shadow-lg shadow-cyan-500/20">
                <Sparkles className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-[0.68rem] uppercase tracking-[0.36em] text-slate-400">
                  Curated peripherals
                </span>
                <span className="block truncate text-lg font-semibold text-white">
                  Mecha<span className="text-gradient">Shop</span>
                </span>
              </span>
            </Link>

            <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
              {navLinks.map((link) => (
                <NavLink
                  key={link.label}
                  to={link.href}
                  className={({ isActive }) =>
                    `focus-ring rounded-full px-4 py-2 text-sm font-medium transition ${
                      isActive
                        ? 'bg-white/8 text-white'
                        : 'text-slate-300 hover:bg-white/6 hover:text-white'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Link
                to={storefrontSectionRoutes.shop}
                className="focus-ring hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300/30 hover:bg-white/10 sm:inline-flex"
              >
                <Search className="h-4 w-4 text-cyan-300" />
                Search gear
              </Link>
              <Link
                to={isAuthenticated ? storefrontSectionRoutes.account : storefrontSectionRoutes.login}
                className="focus-ring hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300/30 hover:bg-white/10 sm:inline-flex"
              >
                {isAuthenticated ? user?.username ?? 'Account' : 'Sign in'}
              </Link>

              <button
                type="button"
                onClick={openCart}
                aria-label={cartCount > 0 ? `Open cart with ${cartCount} items` : 'Open cart'}
                aria-controls="cart-drawer"
                className="focus-ring relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100 transition hover:border-cyan-300/30 hover:bg-white/10"
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 ? (
                  <span
                    key={cartBadgePulseKey}
                    className={`absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 px-1 text-[0.65rem] font-bold text-slate-950 shadow-[0_0_18px_rgba(103,232,249,0.25)] ${
                      isCartBadgePulsing ? 'cart-badge-pulse' : ''
                    }`}
                  >
                    {cartCount}
                  </span>
                ) : null}
              </button>

              <button
                type="button"
                onClick={openMobileMenu}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-nav-dialog"
                aria-label="Open mobile menu"
                className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-100 transition hover:border-cyan-300/30 hover:bg-white/10 lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {isMobileMenuMounted ? (
        <div
          className={`fixed inset-0 z-50 lg:hidden ${isMobileMenuOpen ? '' : 'pointer-events-none'}`}
          aria-hidden={!isMobileMenuOpen}
          inert={!isMobileMenuOpen}
        >
          <button
            type="button"
            aria-label="Close mobile menu"
            data-state={isMobileMenuVisible ? 'open' : 'closed'}
            className="dialog-backdrop absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={closeMobileMenu}
          />
          <div
            ref={menuRef}
            id="mobile-nav-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-menu-title"
            tabIndex={-1}
            data-state={isMobileMenuVisible ? 'open' : 'closed'}
            className="dialog-panel dialog-panel-top absolute inset-x-3 top-3 rounded-[1.8rem] border border-white/10 bg-slate-950/95 p-5 shadow-2xl shadow-black/40"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-cyan-300/80">Navigate</p>
                <h2 id="mobile-menu-title" className="mt-2 text-xl font-semibold text-white">
                  Shop sections
                </h2>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={closeMobileMenu}
                className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200"
                aria-label="Close mobile menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="mt-6 grid gap-2" aria-label="Mobile navigation">
              {navLinks.map((link) => (
                <NavLink
                  key={link.label}
                  to={link.href}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `focus-ring rounded-2xl border px-4 py-3 text-base font-medium transition ${
                      isActive
                        ? 'border-cyan-300/30 bg-white/[0.08] text-white'
                        : 'border-white/8 bg-white/[0.03] text-slate-100 hover:border-cyan-300/20 hover:bg-white/7'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            <div className="mt-5 grid gap-2 border-t border-white/10 pt-4">
              <Link
                to={storefrontSectionRoutes.shop}
                onClick={closeMobileMenu}
                className="focus-ring inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm font-medium text-slate-100 transition hover:border-cyan-300/20 hover:bg-white/7"
              >
                <Search className="h-4 w-4 text-cyan-300" />
                Search gear
              </Link>
              <Link
                to={isAuthenticated ? storefrontSectionRoutes.account : storefrontSectionRoutes.login}
                onClick={closeMobileMenu}
                className="focus-ring inline-flex items-center rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm font-medium text-slate-100 transition hover:border-cyan-300/20 hover:bg-white/7"
              >
                {isAuthenticated ? user?.username ?? 'Account' : 'Sign in'}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default Header;
