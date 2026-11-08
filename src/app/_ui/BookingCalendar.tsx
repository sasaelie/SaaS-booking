import { BOOKING_UI } from '../../config/constants';
import type { BookingCalendarState } from './use-booking-calendar';
import { CalendarNavigation } from './CalendarNavigation';
import { CalendarDays } from './CalendarDays';
export function BookingCalendar({ calendar }: { readonly calendar: BookingCalendarState }) {
  return (
    <div className="ice-calendar">
      <CalendarNavigation calendar={calendar} />
      <CalendarDays calendar={calendar} />
      <p className="ice-calendar-key">
        <span />
        {BOOKING_UI.AVAILABLE}
      </p>
    </div>
  );
}
