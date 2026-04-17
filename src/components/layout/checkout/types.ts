export type CheckoutFieldName =
  | 'fullName'
  | 'email'
  | 'address'
  | 'city'
  | 'postalCode'
  | 'country'
  | 'cardholder'
  | 'cardNumber'
  | 'expiration'
  | 'cvc'
  | 'agreeToTerms';

export interface CheckoutFormValues {
  fullName: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  cardholder: string;
  cardNumber: string;
  expiration: string;
  cvc: string;
  agreeToTerms: boolean;
}

export type CheckoutErrors = Partial<Record<CheckoutFieldName, string>>;
export type InputFieldName = Exclude<CheckoutFieldName, 'agreeToTerms'>;
export type CheckoutSubmissionState = 'idle' | 'submitting' | 'error' | 'success';
