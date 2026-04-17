import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const mockedUseAuth = vi.fn();

vi.mock('../context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => mockedUseAuth(),
}));

vi.mock('../components/layout/Header', () => ({
  default: () => <div>Header</div>,
}));
vi.mock('../components/layout/Footer', () => ({
  default: () => <div>Footer</div>,
}));
vi.mock('../components/layout/CartDrawer', () => ({
  default: () => null,
}));
vi.mock('../components/layout/CartToast', () => ({
  default: () => null,
}));
vi.mock('../components/layout/CheckoutModal', () => ({
  default: () => null,
}));

import App from '../App';

describe('App auth guard', () => {
  it('shows loading state for account route while auth is loading', async () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      token: null,
      user: null,
      signInWithCredentials: vi.fn(),
      signUpWithCredentials: vi.fn(),
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/account']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/loading account/i)).toBeInTheDocument();
  });

  it('redirects unauthenticated user from account to login page', async () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      token: null,
      user: null,
      signInWithCredentials: vi.fn(),
      signUpWithCredentials: vi.fn(),
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/account']}>
        <App />
      </MemoryRouter>,
    );

    expect(
      await screen.findByRole('heading', { name: /sign in to continue checkout/i }),
    ).toBeInTheDocument();
  });

  it('shows account page for authenticated user', async () => {
    mockedUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      token: 'token',
      user: { id: 1, username: 'demo' },
      signInWithCredentials: vi.fn(),
      signUpWithCredentials: vi.fn(),
      signOut: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/account']}>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: /demo/i })).toBeInTheDocument();
  });
});

