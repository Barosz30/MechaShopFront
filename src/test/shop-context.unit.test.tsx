import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { LocaleProvider } from '../context/LocaleContext';
import { ShopProvider, useShop } from '../context/ShopContext';
import { TelemetryProvider } from '../context/TelemetryContext';
import { products } from '../data/products';
import type { DealCycleState } from '../types';

const activeDeal: DealCycleState = {
  phase: 'active',
  days: 1,
  hours: 0,
  minutes: 0,
  seconds: 0,
  countdownTargetDate: Date.now() + 1000,
  activeUntil: Date.now() + 2000,
  nextCycleStart: Date.now() + 3000,
};

const cooldownDeal: DealCycleState = {
  ...activeDeal,
  phase: 'cooldown',
};

let mockedDealState: DealCycleState = activeDeal;

vi.mock('../hooks/useWeeklyDeal', () => ({
  useWeeklyDeal: () => mockedDealState,
}));

function wrapper({ children }: { children: ReactNode }) {
  return (
    <TelemetryProvider>
      <LocaleProvider>
        <ShopProvider>{children}</ShopProvider>
      </LocaleProvider>
    </TelemetryProvider>
  );
}

describe('ShopContext pricing lock behavior', () => {
  beforeEach(() => {
    mockedDealState = activeDeal;
    window.localStorage.clear();
  });

  it('keeps locked spotlight price for existing item after deal expires', () => {
    const spotlightProduct = products.find((product) => product.promotion?.id === 'weekly-spotlight');
    expect(spotlightProduct).toBeDefined();

    const { result, rerender } = renderHook(() => useShop(), { wrapper });

    act(() => {
      result.current.addToCart(spotlightProduct!);
    });

    const firstLine = result.current.cartItems.find((item) => item.id === spotlightProduct!.id);
    expect(firstLine).toBeDefined();
    expect(firstLine!.appliedPromotionId).toBe('weekly-spotlight');
    expect(firstLine!.price).toBeLessThan(spotlightProduct!.price);

    mockedDealState = cooldownDeal;
    rerender();

    act(() => {
      result.current.addToCart(spotlightProduct!);
    });

    const secondLine = result.current.cartItems.find((item) => item.id === spotlightProduct!.id);
    expect(secondLine).toBeDefined();
    expect(secondLine!.quantity).toBe(2);
    expect(secondLine!.price).toBe(firstLine!.price);
    expect(secondLine!.originalPrice).toBe(spotlightProduct!.price);
    expect(secondLine!.appliedPromotionId).toBe('weekly-spotlight');
  });

  it('restores a persisted locked spotlight item from localStorage', () => {
    const spotlightProduct = products.find((product) => product.promotion?.id === 'weekly-spotlight');
    expect(spotlightProduct).toBeDefined();

    window.localStorage.setItem(
      'mechashop-cart-v2',
      JSON.stringify({
        version: 2,
        items: [
          {
            id: spotlightProduct!.id,
            quantity: 2,
            price: 155,
            originalPrice: spotlightProduct!.price,
            appliedPromotionId: 'weekly-spotlight',
          },
        ],
      }),
    );

    mockedDealState = cooldownDeal;

    const { result } = renderHook(() => useShop(), { wrapper });

    expect(result.current.cartItems).toHaveLength(1);
    expect(result.current.cartItems[0]?.price).toBe(155);
    expect(result.current.cartItems[0]?.originalPrice).toBe(spotlightProduct!.price);
    expect(result.current.cartItems[0]?.quantity).toBe(2);
  });
});
