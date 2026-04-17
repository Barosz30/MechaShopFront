import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from '../pages/LoginPage';
import AccountPage from '../pages/AccountPage';
import PaymentStatusPage from '../pages/PaymentStatusPage';
import { AuthProvider } from '../context/AuthContext';

function renderWithAuthProviders(initialPath: string, routePath: string, element: ReactElement) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AuthProvider>
        <Routes>
          <Route path={routePath} element={element} />
          <Route path="/" element={<div>Home</div>} />
          <Route path="/account" element={<div>Account landing</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('Auth/account pages', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('allows login from login page', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.endsWith('/auth/login')) {
        return new Response(JSON.stringify({ access_token: 'token-123' }), { status: 200 });
      }
      if (url.endsWith('/auth/profile')) {
        return new Response(JSON.stringify({ sub: 1, username: 'demo', iat: 0, exp: 0 }), {
          status: 200,
        });
      }
      return new Response(JSON.stringify({}), { status: 200 });
    });

    renderWithAuthProviders('/login', '/login', <LoginPage />);

    await user.type(screen.getByLabelText(/email \/ username/i), 'demo');
    await user.type(screen.getByLabelText(/password/i), 'Demo123!');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(window.localStorage.getItem('mechashop-auth-token')).toBe('token-123');
    });
    expect(fetchMock).toHaveBeenCalled();
  });

  it('loads orders on account page when token exists', async () => {
    window.localStorage.setItem('mechashop-auth-token', 'token-xyz');
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.endsWith('/auth/profile')) {
        return new Response(JSON.stringify({ sub: 7, username: 'demo', iat: 0, exp: 0 }), {
          status: 200,
        });
      }
      if (url.endsWith('/api/orders')) {
        return new Response(
          JSON.stringify([
            {
              id: 12,
              totalAmount: 199,
              status: 'PENDING',
              createdAt: new Date().toISOString(),
              items: [],
            },
          ]),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify({}), { status: 200 });
    });

    renderWithAuthProviders('/account', '/account', <AccountPage />);

    expect(await screen.findByText(/order #12/i)).toBeInTheDocument();
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });

  it('shows payment status for order id from query string', async () => {
    window.localStorage.setItem('mechashop-auth-token', 'token-xyz');
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.endsWith('/auth/profile')) {
        return new Response(JSON.stringify({ sub: 7, username: 'demo', iat: 0, exp: 0 }), {
          status: 200,
        });
      }
      if (url.endsWith('/api/orders/44')) {
        return new Response(
          JSON.stringify({
            id: 44,
            totalAmount: 349,
            status: 'PAID',
            createdAt: new Date().toISOString(),
            items: [],
          }),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify({}), { status: 200 });
    });

    renderWithAuthProviders('/payment-success?orderId=44', '/payment-success', <PaymentStatusPage />);

    expect(await screen.findByText(/order #44 is currently/i)).toBeInTheDocument();
    expect(screen.getByText(/paid/i)).toBeInTheDocument();
  });
});
