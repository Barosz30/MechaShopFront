import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchOrderSummary, type OrderSummary } from '../api/mechanicalShopRestApi';
import { useAuth } from '../context/AuthContext';

function PaymentStatusPage() {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const orderId = Number.parseInt(searchParams.get('orderId') ?? '', 10);

  useEffect(() => {
    const loadOrder = async () => {
      if (!token || !Number.isFinite(orderId)) {
        setIsLoading(false);
        return;
      }
      try {
        const payload = await fetchOrderSummary(token, orderId);
        setOrder(payload);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Could not load order status.');
      } finally {
        setIsLoading(false);
      }
    };
    void loadOrder();
  }, [orderId, token]);

  return (
    <main className="mx-auto flex min-h-[66vh] w-[min(100%-1.5rem,42rem)] items-center py-14">
      <section className="w-full rounded-[1.8rem] border border-white/10 bg-slate-950/65 p-7 text-center">
        <h1 className="text-3xl font-semibold text-white">Payment status</h1>
        {isLoading ? <p className="mt-4 text-slate-300">Checking your order...</p> : null}
        {!isLoading && order ? (
          <p className="mt-4 text-slate-200">
            Order #{order.id} is currently <span className="text-cyan-300">{order.status}</span>.
          </p>
        ) : null}
        {!isLoading && !order && errorMessage ? (
          <p className="mt-4 text-rose-200">{errorMessage}</p>
        ) : null}
        {!isLoading && !order && !errorMessage ? (
          <p className="mt-4 text-slate-300">
            We could not verify this order yet. Please check your account panel.
          </p>
        ) : null}
        <div className="mt-7 flex justify-center gap-3">
          <Link
            to="/account"
            className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm text-slate-100"
          >
            Open account
          </Link>
          <Link
            to="/"
            className="rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 px-5 py-2 text-sm font-semibold text-slate-950"
          >
            Back to store
          </Link>
        </div>
      </section>
    </main>
  );
}

export default PaymentStatusPage;
