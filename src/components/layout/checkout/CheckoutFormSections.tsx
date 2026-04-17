import { ShieldCheck } from 'lucide-react';
import type { ChangeEvent } from 'react';
import CheckoutField from './CheckoutField';
import type {
  CheckoutErrors,
  CheckoutFieldName,
  CheckoutFormValues,
  InputFieldName,
} from './types';

interface CheckoutFormSectionsProps {
  values: CheckoutFormValues;
  errors: CheckoutErrors;
  showError: (fieldName: CheckoutFieldName) => boolean;
  registerFieldRef: (fieldName: CheckoutFieldName) => (element: HTMLInputElement | null) => void;
  handleChange: (fieldName: InputFieldName) => (event: ChangeEvent<HTMLInputElement>) => void;
  handleCheckboxChange: (event: ChangeEvent<HTMLInputElement>) => void;
  markFieldTouched: (fieldName: CheckoutFieldName) => void;
}

function CheckoutFormSections({
  values,
  errors,
  showError,
  registerFieldRef,
  handleChange,
  handleCheckboxChange,
  markFieldTouched,
}: CheckoutFormSectionsProps) {
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <CheckoutField
          inputRef={registerFieldRef('fullName')}
          label="Full name"
          name="fullName"
          value={values.fullName}
          placeholder="Alex Rivera"
          autoComplete="name"
          error={showError('fullName') ? errors.fullName : undefined}
          onChange={handleChange('fullName')}
          onBlur={() => markFieldTouched('fullName')}
        />
        <CheckoutField
          inputRef={registerFieldRef('email')}
          label="Email"
          name="email"
          type="email"
          value={values.email}
          placeholder="alex@example.com"
          autoComplete="email"
          error={showError('email') ? errors.email : undefined}
          onChange={handleChange('email')}
          onBlur={() => markFieldTouched('email')}
        />
      </div>

      <CheckoutField
        inputRef={registerFieldRef('address')}
        label="Shipping address"
        name="address"
        value={values.address}
        placeholder="742 Orbit Lane"
        autoComplete="street-address"
        error={showError('address') ? errors.address : undefined}
        onChange={handleChange('address')}
        onBlur={() => markFieldTouched('address')}
      />

      <div className="grid gap-5 sm:grid-cols-3">
        <CheckoutField
          inputRef={registerFieldRef('city')}
          label="City"
          name="city"
          value={values.city}
          placeholder="Neo Harbor"
          autoComplete="address-level2"
          error={showError('city') ? errors.city : undefined}
          onChange={handleChange('city')}
          onBlur={() => markFieldTouched('city')}
        />
        <CheckoutField
          inputRef={registerFieldRef('postalCode')}
          label="ZIP / Postal code"
          name="postalCode"
          value={values.postalCode}
          placeholder="10021"
          autoComplete="postal-code"
          error={showError('postalCode') ? errors.postalCode : undefined}
          onChange={handleChange('postalCode')}
          onBlur={() => markFieldTouched('postalCode')}
        />
        <CheckoutField
          inputRef={registerFieldRef('country')}
          label="Country"
          name="country"
          value={values.country}
          placeholder="United States"
          autoComplete="country-name"
          error={showError('country') ? errors.country : undefined}
          onChange={handleChange('country')}
          onBlur={() => markFieldTouched('country')}
        />
      </div>

      <div className="space-y-4 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-violet-400/12 text-violet-200">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="font-medium text-white">Payment details</p>
            <p className="text-sm text-slate-400">
              Use 4242 4242 4242 4242 with any valid future date for this mock checkout.
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <CheckoutField
            inputRef={registerFieldRef('cardholder')}
            label="Name on card"
            name="cardholder"
            value={values.cardholder}
            placeholder="Alex Rivera"
            autoComplete="cc-name"
            error={showError('cardholder') ? errors.cardholder : undefined}
            onChange={handleChange('cardholder')}
            onBlur={() => markFieldTouched('cardholder')}
          />
          <CheckoutField
            inputRef={registerFieldRef('cardNumber')}
            label="Card number"
            name="cardNumber"
            value={values.cardNumber}
            placeholder="4242 4242 4242 4242"
            autoComplete="cc-number"
            inputMode="numeric"
            maxLength={19}
            error={showError('cardNumber') ? errors.cardNumber : undefined}
            onChange={handleChange('cardNumber')}
            onBlur={() => markFieldTouched('cardNumber')}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <CheckoutField
            inputRef={registerFieldRef('expiration')}
            label="Expiry"
            name="expiration"
            value={values.expiration}
            placeholder="12 / 28"
            autoComplete="cc-exp"
            inputMode="numeric"
            maxLength={7}
            error={showError('expiration') ? errors.expiration : undefined}
            onChange={handleChange('expiration')}
            onBlur={() => markFieldTouched('expiration')}
          />
          <CheckoutField
            inputRef={registerFieldRef('cvc')}
            label="CVC"
            name="cvc"
            value={values.cvc}
            placeholder="123"
            autoComplete="cc-csc"
            inputMode="numeric"
            maxLength={4}
            error={showError('cvc') ? errors.cvc : undefined}
            onChange={handleChange('cvc')}
            onBlur={() => markFieldTouched('cvc')}
          />
        </div>
      </div>

      <div>
        <label
          className={`block rounded-[1.4rem] border p-4 text-sm transition ${
            showError('agreeToTerms')
              ? 'border-rose-400/35 bg-rose-400/10 text-rose-100'
              : 'border-white/10 bg-white/[0.03] text-slate-300'
          }`}
        >
          <span className="flex items-start gap-3">
            <input
              ref={registerFieldRef('agreeToTerms')}
              type="checkbox"
              checked={values.agreeToTerms}
              onChange={handleCheckboxChange}
              onBlur={() => markFieldTouched('agreeToTerms')}
              aria-invalid={showError('agreeToTerms')}
              aria-describedby={showError('agreeToTerms') ? 'agreeToTerms-error' : undefined}
              className="mt-1 h-4 w-4 rounded border-white/15 bg-slate-950 text-cyan-300"
            />
            <span>
              I agree to MechaShop&apos;s terms and authorize this mock order to be prepared for
              fulfillment updates.
            </span>
          </span>
        </label>
        {showError('agreeToTerms') ? (
          <p id="agreeToTerms-error" className="mt-2 text-sm text-rose-200">
            {errors.agreeToTerms}
          </p>
        ) : null}
      </div>
    </>
  );
}

export default CheckoutFormSections;
