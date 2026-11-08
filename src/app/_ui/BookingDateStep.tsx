import { BOOKING_UI, ACTIVITY_UI } from '../../config/constants';
import type { BookingFlowState } from './use-booking-flow';
import { BookingSlots } from './BookingSlots';
import { BookingSelection } from './BookingSelection';
import { IceIcon } from './IceIcon';
export function BookingDateStep({ flow }: { readonly flow: BookingFlowState }) {
  return (
    <fieldset
      className="ice-step"
      hidden={flow.details || flow.form.state?.success}
      disabled={flow.details || flow.form.pending || flow.form.state?.success}
    >
      <legend className="ice-sr-only">{BOOKING_UI.STEP_SESSION}</legend>
      <div className="ice-step-heading">
        <h2 ref={flow.sessionHeading} tabIndex={-1}>
          {BOOKING_UI.SESSION_TITLE}
        </h2>
        <p>{BOOKING_UI.SESSION_HINT}</p>
      </div>
      {!flow.data.reservationsOpen ? (
        <p className="portal-notice">{ACTIVITY_UI.PUBLIC_BOOKING_CLOSED}</p>
      ) : null}
      <BookingSlots
        slots={flow.data.slots}
        timezone={flow.data.timezone}
        selected={flow.form.selectedIso}
        onSelect={flow.form.setSelected}
      />
      <div className="ice-action-bar">
        <BookingSelection data={flow.data} selected={flow.form.selectedIso} />
        <button
          type="button"
          className="liquid-ice-button ice-primary"
          disabled={!flow.form.selectedIso}
          onClick={() => flow.navigate(true)}
        >
          {BOOKING_UI.CONTINUE}
          <IceIcon name="arrow" />
        </button>
      </div>
    </fieldset>
  );
}
