import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { DealCycleProvider } from '../context/DealCycleContext';
import { AuthProvider } from '../context/AuthContext';
import { LocaleProvider } from '../context/LocaleContext';
import { ShopProvider } from '../context/ShopContext';
import { TelemetryProvider } from '../context/TelemetryContext';

function renderStorefront(initialEntries = ['/']) {
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

describe('Storefront integration', () => {
  it('opens Quick View and adds product to cart with toast CTA', async () => {
    const user = userEvent.setup();
    renderStorefront();

    const quickViewButtons = await screen.findAllByRole('button', {
      name: /open quick view/i,
    });
    await user.click(quickViewButtons[0]!);

    const quickViewDialog = await screen.findByRole('dialog', { name: /aurora tkl pro/i });
    expect(quickViewDialog).toBeInTheDocument();
    await user.click(
      within(quickViewDialog).getByRole('button', {
        name: /add aurora tkl pro to cart/i,
      }),
    );

    expect(await screen.findByText(/aurora tkl pro added to cart/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /view cart/i }));

    const cartDialog = await screen.findByRole('dialog', { name: /your build list/i });
    expect(within(cartDialog).getByText('Aurora TKL Pro')).toBeInTheDocument();
  });

  it('opens quick view from the deep-link product route', async () => {
    renderStorefront(['/product/1']);

    expect(await screen.findByRole('dialog', { name: /aurora tkl pro/i })).toBeInTheDocument();
  });

  it('shows a product-not-found state for invalid product deep-link', async () => {
    renderStorefront(['/product/999999']);

    expect(await screen.findByRole('heading', { name: /product not found/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /go to shop/i })).toBeInTheDocument();
  });

  it(
    'shows checkout validation and allows successful mock order submission',
    async () => {
    const user = userEvent.setup();
    renderStorefront();

    const addAuroraButtons = await screen.findAllByRole('button', {
      name: /add aurora tkl pro to cart/i,
    });
    await user.click(addAuroraButtons[0]!);
    await user.click(screen.getByRole('button', { name: /open cart/i }));
    await user.click(await screen.findByRole('button', { name: /continue to checkout/i }));

    expect(await screen.findByRole('heading', { name: /secure checkout/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /place order/i }));
    expect(
      await screen.findByText(/review the highlighted fields before placing the mock order/i),
    ).toBeInTheDocument();

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
    expect(await screen.findByText(/processing order/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /processing order/i })).toBeDisabled();

    await waitFor(
      () => {
        expect(screen.getByRole('heading', { name: /order received/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /return to storefront/i })).toBeInTheDocument();
      },
      { timeout: 6000 },
    );
    },
    15000,
  );

  it(
    'shows checkout submission error for fallback QA path',
    async () => {
      const user = userEvent.setup();
      renderStorefront();

      const addAuroraButtons = await screen.findAllByRole('button', {
        name: /add aurora tkl pro to cart/i,
      });
      await user.click(addAuroraButtons[0]!);
      await user.click(screen.getByRole('button', { name: /open cart/i }));
      await user.click(await screen.findByRole('button', { name: /continue to checkout/i }));

      const [fullNameInput, cardholderInput] = screen.getAllByPlaceholderText('Alex Rivera');
      await user.type(fullNameInput!, 'Alex Rivera');
      await user.type(screen.getByPlaceholderText('alex@example.com'), 'fail@example.com');
      await user.type(screen.getByPlaceholderText('742 Orbit Lane'), '742 Orbit Lane');
      await user.type(screen.getByPlaceholderText('Neo Harbor'), 'Neo Harbor');
      await user.type(screen.getByPlaceholderText('10021'), '10021');
      await user.type(screen.getByPlaceholderText('United States'), 'United States');
      await user.type(cardholderInput!, 'Alex Rivera');
      await user.type(screen.getByPlaceholderText('4242 4242 4242 4242'), '4242424242424242');
      await user.type(screen.getByPlaceholderText('12 / 28'), '1228');
      await user.type(screen.getByPlaceholderText('123'), '123');
      await user.click(screen.getByRole('checkbox', { name: /i agree to mechashop/i }));

      await user.click(screen.getByRole('button', { name: /place order/i }));

      expect(await screen.findByRole('button', { name: /processing order/i })).toBeDisabled();
      expect(
        await screen.findByRole('button', { name: /retry order/i }, { timeout: 6000 }),
      ).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent(
        /we could not complete the mock order this time/i,
      );
      expect(screen.getByRole('button', { name: /retry order/i })).toBeInTheDocument();
    },
    15000,
  );
});
