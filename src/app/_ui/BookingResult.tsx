import { FORM_LABELS } from '../../config/constants';
import type { BookingActionState } from '../actions/booking.actions';
export function BookingResult({ state }: { readonly state: BookingActionState | null }) {
  if (!state) return null;
  const bank = state.booking?.bankInstructions;
  return (
    <section aria-live="polite">
      <p role={state.success ? 'status' : 'alert'}>{state.message}</p>
      {bank ? (
        <dl>
          <dt>IBAN</dt>
          <dd>{bank.iban}</dd>
          <dt>Bénéficiaire</dt>
          <dd>{bank.accountName}</dd>
          <dt>Communication structurée</dt>
          <dd>{bank.reference}</dd>
        </dl>
      ) : null}
      {state.booking?.selfServiceToken ? (
        <a href={`/manage#token=${encodeURIComponent(state.booking.selfServiceToken)}`}>
          {FORM_LABELS.MANAGE}
        </a>
      ) : null}
    </section>
  );
}
