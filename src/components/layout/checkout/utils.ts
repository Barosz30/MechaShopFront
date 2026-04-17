import type {
  CheckoutErrors,
  CheckoutFieldName,
  CheckoutFormValues,
  InputFieldName,
} from './types';

export const checkoutFieldOrder: CheckoutFieldName[] = [
  'fullName',
  'email',
  'address',
  'city',
  'postalCode',
  'country',
  'cardholder',
  'cardNumber',
  'expiration',
  'cvc',
  'agreeToTerms',
];

export const initialCheckoutValues: CheckoutFormValues = {
  fullName: '',
  email: '',
  address: '',
  city: '',
  postalCode: '',
  country: '',
  cardholder: '',
  cardNumber: '',
  expiration: '',
  cvc: '',
  agreeToTerms: false,
};

export function createTouchedState(value: boolean) {
  return checkoutFieldOrder.reduce(
    (state, fieldName) => ({
      ...state,
      [fieldName]: value,
    }),
    {} as Record<CheckoutFieldName, boolean>,
  );
}

export function createInitialTouchedState() {
  return createTouchedState(false);
}

export function formatCardNumber(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ')
    .trim();
}

export function formatExpiration(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
}

export function formatCvc(value: string) {
  return value.replace(/\D/g, '').slice(0, 4);
}

export function formatCheckoutInput(fieldName: InputFieldName, nextValue: string) {
  if (fieldName === 'cardNumber') {
    return formatCardNumber(nextValue);
  }

  if (fieldName === 'expiration') {
    return formatExpiration(nextValue);
  }

  if (fieldName === 'cvc') {
    return formatCvc(nextValue);
  }

  return nextValue;
}

function wait(durationMs: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

function buildMockOrderReference() {
  return `MS-${Date.now().toString().slice(-6)}`;
}

export async function simulateCheckoutSubmission(values: CheckoutFormValues) {
  await wait(1200);

  const normalizedEmail = values.email.trim().toLowerCase();
  const cardDigits = values.cardNumber.replace(/\D/g, '');

  if (normalizedEmail.includes('fail') || cardDigits.endsWith('0002')) {
    throw new Error(
      'We could not complete the mock order this time. Retry the submission or switch back to the standard demo card details.',
    );
  }

  return {
    reference: buildMockOrderReference(),
  };
}

export function validateCheckoutForm(values: CheckoutFormValues): CheckoutErrors {
  const errors: CheckoutErrors = {};
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const postalPattern = /^[A-Za-z0-9][A-Za-z0-9 -]{2,9}$/;
  const cardDigits = values.cardNumber.replace(/\D/g, '');
  const expiryDigits = values.expiration.replace(/\D/g, '');
  const cvcDigits = values.cvc.replace(/\D/g, '');

  if (values.fullName.trim().length < 2) {
    errors.fullName = 'Enter the full name you want on the order.';
  }

  if (!emailPattern.test(values.email.trim())) {
    errors.email = 'Use a valid email so we can send mock order updates.';
  }

  if (values.address.trim().length < 5) {
    errors.address = 'Add a street address for delivery updates.';
  }

  if (values.city.trim().length < 2) {
    errors.city = 'Enter a city or locality.';
  }

  if (!postalPattern.test(values.postalCode.trim())) {
    errors.postalCode = 'Enter a valid postal code.';
  }

  if (values.country.trim().length < 2) {
    errors.country = 'Enter the destination country.';
  }

  if (values.cardholder.trim().length < 2) {
    errors.cardholder = 'Enter the cardholder name shown on the card.';
  }

  if (cardDigits.length !== 16) {
    errors.cardNumber = 'Use the 16-digit mock card number.';
  }

  if (expiryDigits.length !== 4) {
    errors.expiration = 'Enter expiry as MM / YY.';
  } else {
    const month = Number.parseInt(expiryDigits.slice(0, 2), 10);
    const year = Number.parseInt(expiryDigits.slice(2), 10) + 2000;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (month < 1 || month > 12) {
      errors.expiration = 'Expiry month must be between 01 and 12.';
    } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
      errors.expiration = 'Use a card date that is still valid.';
    }
  }

  if (cvcDigits.length < 3 || cvcDigits.length > 4) {
    errors.cvc = 'Use the 3 or 4 digit security code.';
  }

  if (!values.agreeToTerms) {
    errors.agreeToTerms = 'Please confirm the mock order terms before continuing.';
  }

  return errors;
}
