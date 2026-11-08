import { CALENDAR_UI } from '../../config/constants';
import { dayLabel, monthDays, monthLabel } from './calendar-dates';
import type { BookingCalendarState } from './use-booking-calendar';
export function CalendarDays({ calendar }: { readonly calendar: BookingCalendarState }) {
  return (
    <div className="ice-calendar-grid" role="group" aria-label={monthLabel(calendar.month)}>
      {CALENDAR_UI.WEEKDAYS.map((day, index) => (
        <span className="ice-weekday" key={index} aria-hidden="true">
          {day}
        </span>
      ))}
      {monthDays(calendar.month).map((day, index) =>
        day ? (
          <button
            type="button"
            className="ice-calendar-day"
            key={day}
            aria-label={dayLabel(day)}
            aria-pressed={day === calendar.selectedDay}
            disabled={!calendar.availableDays.has(day)}
            onClick={() => calendar.selectDay(day)}
          >
            {Number(day.split('-').at(-1))}
          </button>
        ) : (
          <span key={`empty-${index}`} />
        ),
      )}
    </div>
  );
}
