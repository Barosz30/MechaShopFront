import { useEffect, useState } from 'react';
import { fetchMyOrders, type OrderSummary } from '../api/mechanicalShopRestApi';
import { useAuth } from '../context/AuthContext';

function AccountPage() {
  const { token, user, signOut } = useAuth();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      if (!token) {
        setOrders([]);
        setIsLoading(false);
        return;
      }
      try {
        const payload = await fetchMyOrders(token);
        setOrders(payload);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Could not load orders.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadOrders();
  }, [token]);

  return (
    <main className="mx-auto w-[min(100%-1.5rem,70rem)] py-14">
      <section className="rounded-[1.8rem] border border-white/10 bg-slate-950/55 p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/80">Account</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">{user?.username}</h1>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="focus-ring rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-100"
          >
            Sign out
          </button>
        </div>

        <h2 className="mt-8 text-xl font-semibold text-white">Your orders</h2>
        {isLoading ? <p className="mt-3 text-sm text-slate-300">Loading orders...</p> : null}
        {errorMessage ? <p className="mt-3 text-sm text-rose-200">{errorMessage}</p> : null}
        {!isLoading && !errorMessage && orders.length === 0 ? (
          <p className="mt-3 text-sm text-slate-300">No orders yet.</p>
        ) : null}
        {!isLoading && orders.length > 0 ? (
          <ul className="mt-4 space-y-3">
            {orders.map((order) => (
              <li
                key={order.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-slate-200">
                  <span>Order #{order.id}</span>
                  <span className="text-cyan-300">{order.status}</span>
                </div>
                <p className="mt-2 text-slate-300">
                  Total: {order.totalAmount} PLN • {new Date(order.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </main>
  );
}

export default AccountPage;
