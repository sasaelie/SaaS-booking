import { BOOKING_UI } from '../../config/constants';
import { monthLabel } from './calendar-dates';
import type { BookingCalendarState } from './use-booking-calendar';
import { IceIcon } from './IceIcon';
export function CalendarNavigation({ calendar }: { readonly calendar: BookingCalendarState }) {
  return (
    <div className="ice-calendar-nav">
      <h3 aria-live="polite">{monthLabel(calendar.month)}</h3>
      <div>
        <button
          type="button"
          className="ice-icon-button"
          aria-label={BOOKING_UI.PREVIOUS_MONTH}
          disabled={!calendar.previous}
          onClick={() => calendar.move(-1)}
        >
          <IceIcon name="previous" />
        </button>
        <button
          type="button"
          className="ice-icon-button"
          aria-label={BOOKING_UI.NEXT_MONTH}
          disabled={!calendar.next}
          onClick={() => calendar.move(1)}
        >
          <IceIcon name="next" />
        </button>
      </div>
    </div>
  );
}
