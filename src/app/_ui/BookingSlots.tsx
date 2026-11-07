import { DEFAULTS, FORM_LABELS } from '../../config/constants';
import type { BookingPageData } from '../../core/use-cases/get-booking-page.use-case';
interface Props {
  readonly slots: BookingPageData['slots'];
  readonly timezone: string;
  readonly selected: string;
  readonly onSelect: (value: string) => void;
}
export function BookingSlots({ slots, timezone, selected, onSelect }: Props) {
  const formatter = new Intl.DateTimeFormat(DEFAULTS.LOCALE, {
    timeZone: timezone,
    dateStyle: 'full',
    timeStyle: 'short',
  });
  return (
    <fieldset className="ice-slots">
      <legend>{FORM_LABELS.SLOTS}</legend>
      {slots.length ? (
        slots.map((slot) => (
          <label
            key={slot.startsAtIso}
            className="ice-slot-pebble ice-slot"
            data-selected={slot.startsAtIso === selected}
          >
            <input
              type="radio"
              name="startsAtIso"
              value={slot.startsAtIso}
              checked={slot.startsAtIso === selected}
              onChange={() => onSelect(slot.startsAtIso)}
              disabled={!slot.isBookable}
              required
            />
            <span>{formatter.format(new Date(slot.startsAtIso))}</span>
            <strong>{slot.availabilityLabel}</strong>
          </label>
        ))
      ) : (
        <p>{FORM_LABELS.NO_SLOTS}</p>
      )}
    </fieldset>
  );
}
