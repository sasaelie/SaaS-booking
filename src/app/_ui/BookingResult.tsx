import type { BookingFlowState } from './use-booking-flow';
import { PAYMENT_MODES, BOOKING_STATUSES } from '../../config/constants';
import { PARTICIPANT_NAV } from '../../config/participant-navigation';
import { formatMoney } from './format-money';
import { bookingPricing } from './booking-pricing';
import { useEffect, useRef, useState } from 'react';
import { BOOKING_UI } from '../../config/constants';
import type { BookingActionState } from '../actions/booking.actions';
import { BookingBankInstructions } from './BookingBankInstructions';
import { BookingProof } from './BookingProof';
import { BookingResultActions } from './BookingResultActions';
import { UI_MESSAGES } from '../../config/constants';
import { EmbeddedBookingManagement } from './EmbeddedBookingManagement';
import { PUBLIC_TEST } from '../../config/public-test';
import { bookingResultState } from './booking-result-state';
export function BookingResult({
  state,
  flow,
}: {
  readonly state: BookingActionState | null;
  readonly flow: BookingFlowState;
}) {
  const [managing, setManaging] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [confirmedToken, setConfirmedToken] = useState<string | null>(null);
  const token = state?.booking?.selfServiceToken;
  const confirmPayment = () => {
    if (token) setConfirmedToken(token);
  };
  if (flow.embedded && managing && token)
    return (
      <EmbeddedBookingManagement
        simulationId={flow.data.simulationId}
        token={token}
        onBack={(booking) => {
          if (booking?.status === BOOKING_STATUSES.CONFIRMED) confirmPayment();
          setCancelled(booking?.status === BOOKING_STATUSES.CANCELLED_BY_ATTENDEE);
          setManaging(false);
        }}
      />
    );
  const result = bookingResultState(state, cancelled, Boolean(token && confirmedToken === token));
  return (
    <ResultContent
      state={result}
      flow={flow}
      onManage={flow.embedded ? () => setManaging(true) : undefined}
      onConfirmed={confirmPayment}
    />
  );
}

function ResultContent({
  state,
  flow,
  onManage,
  onConfirmed,
}: {
  readonly state: BookingActionState | null;
  readonly flow: BookingFlowState;
  readonly onManage?: () => void;
  readonly onConfirmed: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state) ref.current?.focus();
  }, [state]);
  if (!state) return null;
  const Heading = state.success ? 'h1' : 'h2';
  return (
    <div ref={ref} tabIndex={-1} className="ice-result" data-success={state.success}>
      <Heading>{resultTitle(state)}</Heading>
      <p role={state.success ? 'status' : 'alert'}>{state.message}</p>
      <OfflinePayment state={state} flow={flow} />
      <PaymentInstructions state={state} embedded={flow.embedded} />
      {state.booking?.selfServiceToken ? (
        <BookingProof
          token={state.booking.selfServiceToken}
          simulationId={flow.data.simulationId}
          onConfirmed={state.booking.checkoutUrl ? onConfirmed : undefined}
        />
      ) : null}
      <BookingResultActions state={state} flow={flow} onManage={onManage} />
    </div>
  );
}

function PaymentInstructions({
  state,
  embedded,
}: {
  readonly state: BookingActionState;
  readonly embedded: boolean;
}) {
  const checkout = state.booking?.checkoutUrl;
  const bank = state.booking?.bankInstructions;
  return (
    <>
      {checkout && embedded ? <p className="ice-hint">{BOOKING_UI.EMBEDDED_PAYMENT_NOTE}</p> : null}
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
      <p>{flow.data.publicTest ? PUBLIC_TEST.PAYMENT_NOTE : PARTICIPANT_NAV.NOT_PAID}</p>
      <strong>
        {flow.data.publicTest ? PUBLIC_TEST.AMOUNT_LABEL : PARTICIPANT_NAV.OFFLINE_DUE} :{' '}
        {formatMoney(amount, flow.data.currency)}
      </strong>
    </aside>
  );
}

function resultTitle(state: BookingActionState) {
  if (state.booking?.status === BOOKING_STATUSES.CANCELLED_BY_ATTENDEE)
    return UI_MESSAGES.CANCEL_SUCCESS;
  if (!state.success) return BOOKING_UI.ERROR_TITLE;
  if (state.booking?.checkoutUrl) return BOOKING_UI.CHECKOUT_TITLE;
  return state.booking?.bankInstructions ? BOOKING_UI.BANK_TITLE : BOOKING_UI.SUCCESS_TITLE;
}
