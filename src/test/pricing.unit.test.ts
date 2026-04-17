import { getDiscountedPrice, getProductPricing, products } from '../data/products';
import type { DealCycleState } from '../types';

const activeDeal: DealCycleState = {
  phase: 'active',
  days: 1,
  hours: 2,
  minutes: 3,
  seconds: 4,
  countdownTargetDate: Date.now() + 1000,
  activeUntil: Date.now() + 2000,
  nextCycleStart: Date.now() + 3000,
};

const cooldownDeal: DealCycleState = {
  ...activeDeal,
  phase: 'cooldown',
};

describe('pricing helpers', () => {
  it('calculates discounted price using integer rounding', () => {
    expect(getDiscountedPrice(189, 18)).toBe(155);
    expect(getDiscountedPrice(45, 18)).toBe(37);
  });

  it('returns spotlight discount details only during active phase', () => {
    const spotlightProduct = products.find((product) => product.promotion?.id === 'weekly-spotlight');
    expect(spotlightProduct).toBeDefined();

    const activePricing = getProductPricing(spotlightProduct!, activeDeal);
    expect(activePricing.currentPrice).toBeLessThan(spotlightProduct!.price);
    expect(activePricing.originalPrice).toBe(spotlightProduct!.price);
    expect(activePricing.discountPercent).toBe(18);

    const cooldownPricing = getProductPricing(spotlightProduct!, cooldownDeal);
    expect(cooldownPricing.currentPrice).toBe(spotlightProduct!.price);
    expect(cooldownPricing.originalPrice).toBeUndefined();
    expect(cooldownPricing.discountPercent).toBeUndefined();
  });
});
