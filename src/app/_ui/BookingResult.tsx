import { useEffect, useRef } from 'react';
import { BOOKING_UI, FORM_LABELS } from '../../config/constants';
import type { BookingActionState } from '../actions/booking.actions';
import { IceIcon } from './IceIcon';
import { BookingBankInstructions } from './BookingBankInstructions';
export function BookingResult({ state }: { readonly state: BookingActionState | null }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state) ref.current?.focus();
  }, [state]);
  if (!state) return null;
  const bank = state.booking?.bankInstructions;
  return (
    <div ref={ref} tabIndex={-1} className="ice-result" data-success={state.success}>
      {state.success ? (
        <span className="ice-result-icon">
          <IceIcon name="check" />
        </span>
      ) : null}
      <h2>
        {state.success
          ? state.booking?.checkoutUrl
            ? BOOKING_UI.CHECKOUT_TITLE
            : bank
              ? BOOKING_UI.BANK_TITLE
              : BOOKING_UI.SUCCESS_TITLE
          : BOOKING_UI.ERROR_TITLE}
      </h2>
      <p role={state.success ? 'status' : 'alert'}>{state.message}</p>
      <PaymentInstructions state={state} />
      {state.booking?.selfServiceToken ? (
        <a
          className="liquid-ice-button ice-result-link"
          href={`/manage#token=${encodeURIComponent(state.booking.selfServiceToken)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {FORM_LABELS.MANAGE}
          <IceIcon name="arrow" />
        </a>
      ) : null}
    </div>
  );
}

function PaymentInstructions({ state }: { readonly state: BookingActionState }) {
  const checkout = state.booking?.checkoutUrl;
  const bank = state.booking?.bankInstructions;
  return (
    <>
      {checkout ? (
        <a
          className="liquid-ice-button ice-result-link"
          href={checkout}
          target="_blank"
          rel="noopener noreferrer"
        >
          {BOOKING_UI.CONTINUE_PAYMENT}
        </a>
      ) : null}
      {bank ? <BookingBankInstructions bank={bank} /> : null}
    </>
  );
}
