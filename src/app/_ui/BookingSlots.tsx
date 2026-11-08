'use client';
import { BOOKING_UI, FORM_LABELS } from '../../config/constants';
import { BookingCalendar } from './BookingCalendar';
import { useBookingCalendar, type BookingSlotsProps } from './use-booking-calendar';
import { BookingTimes } from './BookingTimes';
export function BookingSlots(props: BookingSlotsProps) {
  const calendar = useBookingCalendar(props);
  if (!props.slots.length) return <p className="ice-empty">{FORM_LABELS.NO_SLOTS}</p>;
  return (
    <div className="ice-session-picker">
      <BookingCalendar calendar={calendar} />
      <div className="ice-times">
        <h3>{BOOKING_UI.HOURS}</h3>
        <BookingTimes
          slots={calendar.visibleSlots}
          timezone={props.timezone}
          selected={props.selected}
          onSelect={props.onSelect}
        />
        <p className="ice-timezone">
          {BOOKING_UI.TIMEZONE}
          <br />
          <strong>{props.timezone}</strong>
        </p>
      </div>
    </div>
  );
}
