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
          ? bank
            ? BOOKING_UI.BANK_TITLE
            : BOOKING_UI.SUCCESS_TITLE
          : BOOKING_UI.ERROR_TITLE}
      </h2>
      <p role={state.success ? 'status' : 'alert'}>{state.message}</p>
      {bank ? <BookingBankInstructions bank={bank} /> : null}
      {state.booking?.selfServiceToken ? (
        <a
          className="liquid-ice-button ice-result-link"
          href={`/manage#token=${encodeURIComponent(state.booking.selfServiceToken)}`}
        >
          {FORM_LABELS.MANAGE}
          <IceIcon name="arrow" />
        </a>
      ) : null}
    </div>
  );
}
