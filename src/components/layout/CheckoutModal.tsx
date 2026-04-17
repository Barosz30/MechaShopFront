import { AlertCircle, CheckCircle2, LoaderCircle, X } from 'lucide-react';
import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { usePresence } from '../../hooks/usePresence';
import { useShop } from '../../context/ShopContext';
import { useTelemetry } from '../../context/TelemetryContext';
import { useAuth } from '../../context/AuthContext';
import { createCheckoutSession } from '../../api/mechanicalShopRestApi';
import CheckoutFormSections from './checkout/CheckoutFormSections';
import CheckoutSummary from './checkout/CheckoutSummary';
import type {
  CheckoutFieldName,
  CheckoutSubmissionState,
  CheckoutFormValues,
  InputFieldName,
} from './checkout/types';
import {
  checkoutFieldOrder,
  createInitialTouchedState,
  createTouchedState,
  formatCheckoutInput,
  initialCheckoutValues,
  simulateCheckoutSubmission,
  validateCheckoutForm,
} from './checkout/utils';

function CheckoutModal() {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const fieldRefs = useRef<Partial<Record<CheckoutFieldName, HTMLInputElement | null>>>({});
  const {
    cartItems,
    subtotal,
    shippingCost,
    total,
    isCheckoutOpen,
    closeCheckout,
    completeMockOrder,
  } = useShop();
  const { track } = useTelemetry();
  const { token, isAuthenticated } = useAuth();
  const [values, setValues] = useState<CheckoutFormValues>(initialCheckoutValues);
  const [touched, setTouched] = useState<Record<CheckoutFieldName, boolean>>(createInitialTouchedState);
  const [submitCount, setSubmitCount] = useState(0);
  const [submissionState, setSubmissionState] = useState<CheckoutSubmissionState>('idle');
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [confirmationCode, setConfirmationCode] = useState('');
  const { isMounted, isVisible } = usePresence(isCheckoutOpen);
  const errors = validateCheckoutForm(values);
  const isOrderPlaced = submissionState === 'success';
  const isSubmitting = submissionState === 'submitting';
  const hasLockedSpotlightPricing = cartItems.some(
    (item) => item.appliedPromotionId === 'weekly-spotlight',
  );

  const resetSubmissionFeedback = () => {
    setSubmissionState('idle');
    setSubmissionError(null);
    setConfirmationCode('');
  };

  const handleFinish = () => {
    resetSubmissionFeedback();
    setSubmitCount(0);
    setTouched(createInitialTouchedState());
    setValues(initialCheckoutValues);
    completeMockOrder();
  };

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }

    if (submissionState === 'success') {
      handleFinish();
      return;
    }

    resetSubmissionFeedback();
    closeCheckout();
  };

  useBodyScrollLock(isMounted);
  useEscapeKey(isCheckoutOpen, handleClose);
  useFocusTrap(modalRef, isCheckoutOpen, { initialFocusRef: closeButtonRef });

  if (!isMounted) {
    return null;
  }

  const registerFieldRef = (fieldName: CheckoutFieldName) => (element: HTMLInputElement | null) => {
    fieldRefs.current[fieldName] = element;
  };

  const markFieldTouched = (fieldName: CheckoutFieldName) => {
    setTouched((current) => ({
      ...current,
      [fieldName]: true,
    }));
  };

  const updateValue = (fieldName: InputFieldName, nextValue: string) => {
    setValues((current) => ({
      ...current,
      [fieldName]: formatCheckoutInput(fieldName, nextValue),
    }));

    if (submissionState === 'error') {
      setSubmissionState('idle');
      setSubmissionError(null);
    }
  };

  const handleChange = (fieldName: InputFieldName) => (event: ChangeEvent<HTMLInputElement>) => {
    updateValue(fieldName, event.target.value);
  };

  const handleCheckboxChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValues((current) => ({
      ...current,
      agreeToTerms: event.target.checked,
    }));

    if (submissionState === 'error') {
      setSubmissionState('idle');
      setSubmissionError(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitCount((current) => current + 1);
    setTouched(createTouchedState(true));
    resetSubmissionFeedback();

    const nextErrors = validateCheckoutForm(values);
    const firstInvalidField = checkoutFieldOrder.find((fieldName) => nextErrors[fieldName]);

    if (firstInvalidField) {
      fieldRefs.current[firstInvalidField]?.focus();
      return;
    }

    setSubmissionState('submitting');

    try {
      if (isAuthenticated && token) {
        const checkoutItems = cartItems.map((item) => ({
          itemId: item.id,
          quantity: item.quantity,
        }));
        const session = await createCheckoutSession(token, checkoutItems);
        setConfirmationCode(`ORDER-${Date.now().toString().slice(-6)}`);
        setSubmissionState('success');
        track('checkout_success', {
          reference: 'redirect_to_stripe',
          total,
          cartCount: cartItems.reduce((count, item) => count + item.quantity, 0),
          route: typeof window === 'undefined' ? '/' : window.location.pathname,
        });
        window.location.assign(session.url);
        return;
      }

      const result = await simulateCheckoutSubmission(values);
      setConfirmationCode(result.reference);
      setSubmissionState('success');
      track('checkout_success', {
        reference: result.reference,
        total,
        cartCount: cartItems.reduce((count, item) => count + item.quantity, 0),
        route: typeof window === 'undefined' ? '/' : window.location.pathname,
      });
    } catch (error) {
      setSubmissionState('error');
      setSubmissionError(
        error instanceof Error
          ? error.message
          : 'We could not complete the mock order. Please try again.',
      );
      track('checkout_error', {
        errorMessage:
          error instanceof Error
            ? error.message
            : 'We could not complete the mock order. Please try again.',
        route: typeof window === 'undefined' ? '/' : window.location.pathname,
      });
    }
  };

  const showError = (fieldName: CheckoutFieldName) => Boolean(errors[fieldName] && (touched[fieldName] || submitCount > 0));

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center p-4 ${isCheckoutOpen ? '' : 'pointer-events-none'}`}
      aria-hidden={!isCheckoutOpen}
      inert={!isCheckoutOpen}
    >
      <button
        type="button"
        aria-label="Close checkout"
        data-state={isVisible ? 'open' : 'closed'}
        className="dialog-backdrop absolute inset-0 bg-slate-950/85 backdrop-blur-sm"
        onClick={handleClose}
        disabled={isSubmitting}
      />

      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        tabIndex={-1}
        data-state={isVisible ? 'open' : 'closed'}
        className="dialog-panel dialog-panel-modal relative z-10 grid max-h-[92vh] w-full max-w-5xl gap-6 overflow-y-auto rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(11,18,32,0.96),rgba(6,10,18,0.98))] p-6 shadow-2xl shadow-black/40 lg:grid-cols-[1.08fr_0.92fr] lg:p-8"
      >
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-cyan-300/80">
                Express checkout
              </p>
              <h2 id="checkout-title" className="mt-2 text-3xl font-semibold text-white">
                {isOrderPlaced
                  ? 'Order received'
                  : isSubmitting
                    ? 'Processing your order'
                    : 'Secure checkout'}
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-7 text-slate-400">
                {isOrderPlaced
                  ? 'Thanks for choosing MechaShop. We have your details and your build is queued for confirmation.'
                  : isSubmitting
                    ? 'We are validating your mock order details and preparing the storefront success state.'
                    : 'Complete shipping and mock payment details below to reserve today’s picks and keep your order moving.'}
              </p>
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="focus-ring inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Close checkout"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {isOrderPlaced ? (
            <div className="mt-8 rounded-[1.8rem] border border-emerald-400/20 bg-emerald-400/10 p-6">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-300">
                <CheckCircle2 className="h-7 w-7" />
              </span>
              <h3 className="mt-5 text-2xl font-semibold text-white">Your order is in</h3>
              <p className="mt-3 max-w-lg text-sm leading-7 text-slate-300">
                A confirmation email and shipment updates will follow once your build leaves the
                warehouse.
              </p>
              <p className="mt-3 text-sm font-medium text-emerald-100">
                Reference: {confirmationCode}
              </p>
              <button
                type="button"
                onClick={handleFinish}
                className="focus-ring mt-6 rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 px-5 py-3 text-sm font-semibold text-slate-950"
              >
                Return to storefront
              </button>
            </div>
          ) : (
            <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}>
              <div className="rounded-[1.35rem] border border-cyan-300/12 bg-cyan-300/8 px-4 py-3 text-sm text-cyan-50">
                <p className="font-medium text-white">
                  {isAuthenticated ? 'Secure checkout' : 'Demo-safe checkout'}
                </p>
                <p className="mt-1 text-cyan-100/80">
                  {isAuthenticated
                    ? 'Signed-in customers are redirected to backend Stripe checkout.'
                    : 'Payment details are validated locally for this mock experience only. No real charge is created.'}
                </p>
                {!isAuthenticated ? (
                  <p className="mt-2 text-cyan-100/70">
                    Sign in to switch from demo mode to real backend checkout.
                  </p>
                ) : null}
              </div>

              {hasLockedSpotlightPricing ? (
                <div className="rounded-[1.35rem] border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                  Spotlight prices already in your cart are locked and will stay unchanged through
                  checkout for this session.
                </div>
              ) : null}

              {submitCount > 0 && Object.keys(errors).length > 0 ? (
                <div
                  className="flex items-start gap-3 rounded-[1.35rem] border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100"
                  role="alert"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>Review the highlighted fields before placing the mock order.</p>
                </div>
              ) : null}

              {submissionState === 'error' && submissionError ? (
                <div
                  className="flex items-start gap-3 rounded-[1.35rem] border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100"
                  role="alert"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{submissionError}</p>
                </div>
              ) : null}

              <CheckoutFormSections
                values={values}
                errors={errors}
                showError={showError}
                registerFieldRef={registerFieldRef}
                handleChange={handleChange}
                handleCheckboxChange={handleCheckboxChange}
                markFieldTouched={markFieldTouched}
              />

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="focus-ring inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-300 to-violet-400 px-5 py-3 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Processing order...
                    </>
                  ) : submissionState === 'error' ? (
                    'Retry order'
                  ) : (
                    'Place order'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="focus-ring rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Return to cart
                </button>
              </div>
            </form>
          )}
        </div>

        <CheckoutSummary
          cartItems={cartItems}
          subtotal={subtotal}
          shippingCost={shippingCost}
          total={total}
          hasLockedSpotlightPricing={hasLockedSpotlightPricing}
        />
      </div>
    </div>
  );
}

export default CheckoutModal;
