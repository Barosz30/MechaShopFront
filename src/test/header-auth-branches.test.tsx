import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Header from '../components/layout/Header';
import { AuthProvider } from '../context/AuthContext';
import { ShopProvider } from '../context/ShopContext';
import { TelemetryProvider } from '../context/TelemetryContext';
import { LocaleProvider } from '../context/LocaleContext';
import { DealCycleProvider } from '../context/DealCycleContext';

function renderHeader() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <TelemetryProvider>
        <AuthProvider>
          <LocaleProvider>
            <DealCycleProvider>
              <ShopProvider>
                <Header />
              </ShopProvider>
            </DealCycleProvider>
          </LocaleProvider>
        </AuthProvider>
      </TelemetryProvider>
    </MemoryRouter>,
  );
}

describe('Header auth branches', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('shows Sign in link when not authenticated', async () => {
    renderHeader();
    expect(await screen.findByRole('link', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows username link when authenticated', async () => {
    window.localStorage.setItem('mechashop-auth-token', 'token-xyz');

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : input.toString();

      if (url.endsWith('/auth/profile')) {
        return new Response(JSON.stringify({ sub: 7, username: 'demo', iat: 0, exp: 0 }), {
          status: 200,
        });
      }

      // Force ShopProvider to keep fallback catalog
      if (url.includes('/graphql')) {
        return new Response(JSON.stringify({ errors: [{ message: 'disabled' }] }), { status: 500 });
      }

      return new Response(JSON.stringify({}), { status: 404 });
    });

    renderHeader();

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /demo/i })).toBeInTheDocument();
    });
  });

  it('opens mobile menu when menu button is clicked', async () => {
    const user = userEvent.setup();
    renderHeader();

    await user.click(await screen.findByRole('button', { name: /open mobile menu/i }));

    expect(screen.getByRole('dialog', { name: /shop sections/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /close mobile menu/i })).toHaveLength(2);
  });
});

