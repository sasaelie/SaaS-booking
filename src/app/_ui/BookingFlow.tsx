import type { BookingPageData } from '../../core/use-cases/get-booking-page.use-case';
import { useBookingFlow } from './use-booking-flow';
import { BookingProgress } from './BookingProgress';
import { BookingDateStep } from './BookingDateStep';
import { BookingDetails } from './BookingDetails';
import { BookingResult } from './BookingResult';
import { EventInformation } from './EventInformation';
import { BOOKING_UI } from '../../config/constants';
export function BookingFlow({ data }: { readonly data: BookingPageData }) {
  const flow = useBookingFlow(data);
  return (
    <form className="ice-booking-flow" onSubmit={flow.submit} aria-busy={flow.form.pending}>
      <input type="hidden" name="startsAtIso" value={flow.form.selectedIso} />
      {!flow.form.state?.success ? <BookingProgress flow={flow} /> : null}
      {!flow.form.state?.success ? <EventInformation data={data} /> : null}
      {!data.paymentReady && !flow.form.state?.success ? (
        <p className="portal-notice" role="note">
          {BOOKING_UI.PAYMENT_NOT_READY}
        </p>
      ) : null}
      <BookingDateStep flow={flow} />
      <BookingDetails flow={flow} />
      <BookingResult state={flow.form.state} flow={flow} />
    </form>
  );
}
