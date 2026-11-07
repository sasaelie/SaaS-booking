import { BOOKING_UI } from '../../config/constants';
import { timeLabel } from './calendar-dates';
import type { BookingSlotsProps } from './use-booking-calendar';
export function BookingTimes(props: BookingSlotsProps) {
  return (
    <div className="ice-time-list">
      {props.slots.length ? (
        props.slots.map((slot) => (
          <label
            key={slot.startsAtIso}
            className="ice-slot-pebble ice-time-slot"
            data-selected={slot.startsAtIso === props.selected}
          >
            <input
              type="radio"
              name="sessionChoice"
              value={slot.startsAtIso}
              checked={slot.startsAtIso === props.selected}
              disabled={!slot.isBookable}
              onChange={() => props.onSelect(slot.startsAtIso)}
            />
            <span>
              <strong>
                {timeLabel(slot.startsAtIso, props.timezone)} –{' '}
                {timeLabel(slot.endsAtIso, props.timezone)}
              </strong>
              <small>
                {slot.availabilityLabel} {BOOKING_UI.PLACES}
              </small>
            </span>
          </label>
        ))
      ) : (
        <p className="ice-empty">{BOOKING_UI.EMPTY_DAY}</p>
      )}
    </div>
  );
}
