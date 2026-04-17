import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { DealCycleProvider } from '../context/DealCycleContext';
import { LocaleProvider } from '../context/LocaleContext';
import { ShopProvider } from '../context/ShopContext';
import { TelemetryProvider } from '../context/TelemetryContext';
import { AuthProvider } from '../context/AuthContext';
import { vi, describe, it, beforeEach, expect } from 'vitest';

function renderStorefrontWithAuth(initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <TelemetryProvider>
        <AuthProvider>
          <LocaleProvider>
            <DealCycleProvider>
              <ShopProvider>
                <App />
              </ShopProvider>
            </DealCycleProvider>
          </LocaleProvider>
        </AuthProvider>
      </TelemetryProvider>
    </MemoryRouter>,
  );
}

describe('Authenticated checkout branch', () => {
  beforeEach(() => {
    window.localStorage.setItem('mechashop-auth-token', 'token-xyz');
    vi.restoreAllMocks();
  });

  it(
    'redirects to backend Stripe checkout when authenticated',
    async () => {
    let didCreateCheckoutSession = false;

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : input.toString();

      // Auth profile for AuthProvider
      if (url.endsWith('/auth/profile')) {
        return new Response(JSON.stringify({ sub: 7, username: 'demo', iat: 0, exp: 0 }), {
          status: 200,
        });
      }

      // Force ShopProvider to keep fallback mock catalog
      if (url.includes('/graphql')) {
        return new Response(JSON.stringify({ errors: [{ message: 'disabled' }] }), { status: 500 });
      }

      // Real checkout session creation
      if (url.includes('/api/payments/create-checkout-session')) {
        didCreateCheckoutSession = true;
        return new Response(JSON.stringify({ url: 'https://stripe.example/checkout' }), { status: 200 });
      }

      return new Response(JSON.stringify({}), { status: 404 });
    });

    const user = userEvent.setup();
    renderStorefrontWithAuth();

    // Quick View: add Aurora TKL Pro to cart
    const quickViewButtons = await screen.findAllByRole('button', { name: /open quick view/i });
    await user.click(quickViewButtons[0]!);
    const quickViewDialog = await screen.findByRole('dialog', { name: /aurora tkl pro/i });
    await user.click(
      within(quickViewDialog).getByRole('button', { name: /add aurora tkl pro to cart/i }),
    );

    await user.click(screen.getByRole('button', { name: /view cart/i }));

    const checkoutButton = await screen.findByRole('button', { name: /continue to checkout/i });
    await user.click(checkoutButton);

    // Authenticated path should submit via backend create-checkout-session
    // Wait until AuthProvider finished loading (CheckoutModal shows signed-in copy).
    await waitFor(() => {
      expect(
        screen.getByText(/signed-in customers are redirected to backend stripe checkout/i),
      ).toBeInTheDocument();
    });

    const [fullNameInput, cardholderInput] = screen.getAllByPlaceholderText('Alex Rivera');
    await user.type(fullNameInput!, 'Alex Rivera');
    await user.type(screen.getByPlaceholderText('alex@example.com'), 'alex@example.com');
    await user.type(screen.getByPlaceholderText('742 Orbit Lane'), '742 Orbit Lane');
    await user.type(screen.getByPlaceholderText('Neo Harbor'), 'Neo Harbor');
    await user.type(screen.getByPlaceholderText('10021'), '10021');
    await user.type(screen.getByPlaceholderText('United States'), 'United States');
    await user.type(cardholderInput!, 'Alex Rivera');
    await user.type(screen.getByPlaceholderText('4242 4242 4242 4242'), '4242424242424242');
    await user.type(screen.getByPlaceholderText('12 / 28'), '1228');
    await user.type(screen.getByPlaceholderText('123'), '123');
    await user.click(screen.getByRole('checkbox', { name: /i agree to mechashop's terms/i }));

    await user.click(screen.getByRole('button', { name: /place order/i }));

    expect(await screen.findByRole('heading', { name: /order received/i })).toBeInTheDocument();
    expect(didCreateCheckoutSession).toBe(true);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /return to storefront/i }),
        ).toBeInTheDocument();
      });
    },
    20000,
  );
});

