import { lazy, Suspense, type ReactElement } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/layout/Header';
import StorefrontPage from './pages/StorefrontPage';
import { storefrontSectionRoutes } from './config/routes';
import { useAuth } from './context/AuthContext';

const ApiHealthBanner = lazy(() => import('./components/layout/ApiHealthBanner'));
const Footer = lazy(() => import('./components/layout/Footer'));
const CartDrawer = lazy(() => import('./components/layout/CartDrawer'));
const CartToast = lazy(() => import('./components/layout/CartToast'));
const CheckoutModal = lazy(() => import('./components/layout/CheckoutModal'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const PaymentStatusPage = lazy(() => import('./pages/PaymentStatusPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function RouteFallback() {
  return (
    <main className="mx-auto flex min-h-[56vh] w-[min(100%-1.5rem,34rem)] items-center justify-center py-14 text-slate-200">
      Loading page...
    </main>
  );
}

function RequireAuth({ children }: { children: ReactElement }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-[56vh] w-[min(100%-1.5rem,34rem)] items-center justify-center py-14 text-slate-200">
        Loading account...
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={storefrontSectionRoutes.login}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}

function App() {
  const showApiHealthBanner =
    (import.meta.env.VITE_ENABLE_API_HEALTH_BANNER as string | undefined) === 'true';

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[radial-gradient(circle_at_top,_rgba(67,216,255,0.16),_transparent_24%),radial-gradient(circle_at_85%_12%,_rgba(147,120,255,0.16),_transparent_22%),linear-gradient(180deg,_#050816_0%,_#091224_45%,_#04070f_100%)] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:96px_96px] opacity-20 [mask-image:radial-gradient(circle_at_center,black,transparent_80%)]" />
      <div className="pointer-events-none absolute left-[-12rem] top-24 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl orb-float" />
      <div className="pointer-events-none absolute bottom-0 right-[-10rem] h-96 w-96 rounded-full bg-fuchsia-500/15 blur-3xl orb-float-delayed" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-cyan-400/10 via-transparent to-transparent" />

      <Header />
      {showApiHealthBanner ? (
        <Suspense fallback={null}>
          <ApiHealthBanner />
        </Suspense>
      ) : null}
      <Suspense fallback={null}>
        <CartDrawer />
      </Suspense>
      <Suspense fallback={null}>
        <CheckoutModal />
      </Suspense>
      <Suspense fallback={null}>
        <CartToast />
      </Suspense>

      <Routes>
        <Route path={storefrontSectionRoutes.home} element={<StorefrontPage />} />
        <Route path={storefrontSectionRoutes.shop} element={<StorefrontPage />} />
        <Route path={storefrontSectionRoutes.categories} element={<StorefrontPage />} />
        <Route path={storefrontSectionRoutes.deals} element={<StorefrontPage />} />
        <Route path={storefrontSectionRoutes.reviews} element={<StorefrontPage />} />
        <Route path={storefrontSectionRoutes.faq} element={<StorefrontPage />} />
        <Route path={storefrontSectionRoutes.newsletter} element={<StorefrontPage />} />
        <Route
          path={storefrontSectionRoutes.login}
          element={
            <Suspense fallback={<RouteFallback />}>
              <LoginPage />
            </Suspense>
          }
        />
        <Route
          path={storefrontSectionRoutes.account}
          element={
            <Suspense fallback={<RouteFallback />}>
              <RequireAuth>
                <AccountPage />
              </RequireAuth>
            </Suspense>
          }
        />
        <Route
          path={storefrontSectionRoutes.paymentSuccess}
          element={
            <Suspense fallback={<RouteFallback />}>
              <PaymentStatusPage />
            </Suspense>
          }
        />
        <Route
          path={storefrontSectionRoutes.paymentCancel}
          element={
            <Suspense fallback={<RouteFallback />}>
              <PaymentStatusPage />
            </Suspense>
          }
        />
        <Route path="/product/:id" element={<StorefrontPage />} />
        <Route
          path="*"
          element={
            <Suspense fallback={<RouteFallback />}>
              <NotFoundPage />
            </Suspense>
          }
        />
      </Routes>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}

export default App;
