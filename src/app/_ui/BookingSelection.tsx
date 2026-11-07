import type { BookingPageData } from '../../core/use-cases/get-booking-page.use-case';
import { BOOKING_UI, DEFAULTS } from '../../config/constants';
import { timeLabel } from './calendar-dates';
import { IceIcon } from './IceIcon';
export function BookingSelection({
  data,
  selected,
}: {
  readonly data: BookingPageData;
  readonly selected: string;
}) {
  const slot = data.slots.find((value) => value.startsAtIso === selected);
  if (!slot) return <p className="ice-empty">{BOOKING_UI.EMPTY_DAY}</p>;
  const date = new Intl.DateTimeFormat(DEFAULTS.LOCALE, {
    timeZone: data.timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(selected));
  return (
    <div className="ice-selection">
      <IceIcon name="calendar" />
      <span>
        <strong>{date}</strong>
        <small>
          {timeLabel(selected, data.timezone)} – {timeLabel(slot.endsAtIso, data.timezone)}
        </small>
      </span>
    </div>
  );
}
