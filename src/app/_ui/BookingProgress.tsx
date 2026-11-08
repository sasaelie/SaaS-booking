import { BOOKING_UI } from '../../config/constants';
import type { BookingFlowState } from './use-booking-flow';
import { IceIcon } from './IceIcon';
export function BookingProgress({ flow }: { readonly flow: BookingFlowState }) {
  return (
    <nav className="ice-progress" aria-label={BOOKING_UI.BRAND_NOTE}>
      <button
        type="button"
        aria-current={!flow.details ? 'step' : undefined}
        disabled={flow.form.pending || flow.form.state?.success}
        onClick={() => flow.navigate(false)}
      >
        <span>{flow.details ? <IceIcon name="check" /> : '01'}</span>
        {BOOKING_UI.STEP_SESSION}
      </button>
      <i aria-hidden="true" />
      <span className="ice-progress-current" aria-current={flow.details ? 'step' : undefined}>
        <span>02</span>
        {BOOKING_UI.STEP_CONTACT}
      </span>
    </nav>
  );
}
