import {
  formatCardNumber,
  formatCheckoutInput,
  formatCvc,
  formatExpiration,
  validateCheckoutForm,
} from '../components/layout/checkout/utils';

describe('checkout utils', () => {
  it('formats payment fields consistently', () => {
    expect(formatCardNumber('4242424242424242')).toBe('4242 4242 4242 4242');
    expect(formatExpiration('1228')).toBe('12 / 28');
    expect(formatCvc('12345')).toBe('1234');
    expect(formatCheckoutInput('cardNumber', '4242424242424242')).toBe('4242 4242 4242 4242');
  });

  it('rejects expired cards during validation', () => {
    const errors = validateCheckoutForm({
      fullName: 'Alex Rivera',
      email: 'alex@example.com',
      address: '742 Orbit Lane',
      city: 'Neo Harbor',
      postalCode: '10021',
      country: 'United States',
      cardholder: 'Alex Rivera',
      cardNumber: '4242 4242 4242 4242',
      expiration: '01 / 20',
      cvc: '123',
      agreeToTerms: true,
    });

    expect(errors.expiration).toMatch(/still valid/i);
  });
});
