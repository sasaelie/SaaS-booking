import type { BookingFlowState } from './use-booking-flow';
import { PAYMENT_MODES, BOOKING_STATUSES } from '../../config/constants';
import { PARTICIPANT_NAV } from '../../config/participant-navigation';
import { formatMoney } from './format-money';
import { bookingPricing } from './booking-pricing';
import { useEffect, useRef } from 'react';
import { BOOKING_UI, FORM_LABELS } from '../../config/constants';
import type { BookingActionState } from '../actions/booking.actions';
import { IceIcon } from './IceIcon';
import { BookingBankInstructions } from './BookingBankInstructions';
export function BookingResult({
  state,
  flow,
}: {
  readonly state: BookingActionState | null;
  readonly flow: BookingFlowState;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state) ref.current?.focus();
  }, [state]);
  if (!state) return null;
  return (
    <div ref={ref} tabIndex={-1} className="ice-result" data-success={state.success}>
      <h2>{resultTitle(state)}</h2>
      <p role={state.success ? 'status' : 'alert'}>{state.message}</p>
      <OfflinePayment state={state} flow={flow} />
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

function OfflinePayment({
  state,
  flow,
}: {
  readonly state: BookingActionState;
  readonly flow: BookingFlowState;
}) {
  const amount = bookingPricing(flow).amount;
  if (
    !state.success ||
    state.booking?.status !== BOOKING_STATUSES.CONFIRMED ||
    flow.data.paymentMode !== PAYMENT_MODES.NONE ||
    amount === 0
  )
    return null;
  return (
    <aside className="ice-bank-instructions">
      <p>{PARTICIPANT_NAV.NOT_PAID}</p>
      <strong>
        {PARTICIPANT_NAV.OFFLINE_DUE} : {formatMoney(amount, flow.data.currency)}
      </strong>
    </aside>
  );
}

function resultTitle(state: BookingActionState) {
  if (!state.success) return BOOKING_UI.ERROR_TITLE;
  if (state.booking?.checkoutUrl) return BOOKING_UI.CHECKOUT_TITLE;
  return state.booking?.bankInstructions ? BOOKING_UI.BANK_TITLE : BOOKING_UI.SUCCESS_TITLE;
}
