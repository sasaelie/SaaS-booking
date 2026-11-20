import { BOOKING_UI } from '../../config/constants';
import type { BookingFlowState } from './use-booking-flow';
import { BookingContext } from './BookingContext';
import { BookingFields } from './BookingFields';
import { BookingTerms } from './BookingTerms';
import { VoucherField } from './VoucherField';
import { BookingCheckout } from './BookingCheckout';
export function BookingDetails({ flow }: { readonly flow: BookingFlowState }) {
  return (
    <fieldset
      className="ice-step ice-details"
      hidden={!flow.details || flow.form.state?.success}
      disabled={!flow.details || flow.form.pending || flow.form.state?.success}
    >
      <legend className="ice-sr-only">{BOOKING_UI.STEP_CONTACT}</legend>
      {flow.details && !flow.form.state?.success ? <BookingContext flow={flow} /> : null}
      <div className="ice-step-heading">
        <h2 ref={flow.contactHeading} tabIndex={-1}>
          {BOOKING_UI.CONTACT_TITLE}
        </h2>
        <p>{BOOKING_UI.CONTACT_HINT}</p>
      </div>
      <BookingFields policy={flow.data} />
      <VoucherField quote={flow.quote} />
      <BookingTerms
        key={flow.data.terms.versionHash}
        terms={flow.data.terms}
        editUrl={flow.data.termsEditUrl}
        active={flow.details && !flow.form.state?.success}
      />
      <BookingCheckout flow={flow} />
    </fieldset>
  );
}
