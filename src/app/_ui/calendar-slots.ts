import type { BookingSlotsProps } from './use-booking-calendar';
import { localDay, monthOf } from './calendar-dates';
export function calendarSlots(props: BookingSlotsProps) {
  const days = new Map<string, BookingSlotsProps['slots'][number][]>();
  for (const slot of props.slots) {
    const day = localDay(slot.startsAtIso, props.timezone);
    days.set(day, [...(days.get(day) ?? []), slot]);
  }
  return days;
}
export function firstInMonth(props: BookingSlotsProps, month: string) {
  return (
    props.slots.find(
      (slot) => slot.isBookable && monthOf(localDay(slot.startsAtIso, props.timezone)) === month,
    )?.startsAtIso ?? ''
  );
}
