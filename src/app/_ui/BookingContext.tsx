import type { BookingFlowState } from './use-booking-flow';
import { BOOKING_UI } from '../../config/constants';
import { SERVICE } from '../../config/service';
import { BookingSelection } from './BookingSelection';
import { EventInformation } from './EventInformation';
import { formatMoney } from './format-money';
export function BookingContext({ flow }: { readonly flow: BookingFlowState }) {
  const information =
    flow.data.address ||
    flow.data.addressDelayed ||
    flow.data.description ||
    flow.data.practicalInfo;
  return (
    <section className="booking-context">
      <div className="booking-context-heading">
        <h1>{flow.data.activityName}</h1>
        <strong>{formatMoney(flow.data.priceCents, flow.data.currency)}</strong>
      </div>
      <BookingSelection data={flow.data} selected={flow.form.selectedIso} />
      <button type="button" className="ice-text-button" onClick={() => flow.navigate(false)}>
        {BOOKING_UI.CHANGE}
      </button>
      {information ? (
        <details className="booking-context-information">
          <summary>{SERVICE.PRACTICAL_SUMMARY}</summary>
          <EventInformation data={flow.data} />
        </details>
      ) : null}
    </section>
  );
}
