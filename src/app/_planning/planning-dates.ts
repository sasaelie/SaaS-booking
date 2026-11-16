import { CALENDAR_UI, DEFAULTS, TIME } from '../../config/constants';
import { PLANNING } from '../../config/planning';
import { localDay } from '../_ui/calendar-dates';
export function shiftDay(day: string, amount: number): string {
  const date = new Date(`${day}${CALENDAR_UI.DAY_SUFFIX}`);
  return new Date(date.getTime() + amount * TIME.DAY_MS)
    .toISOString()
    .slice(0, PLANNING.DAY_KEY_LENGTH);
}
export function weekStart(day: string): string {
  const weekday = new Date(`${day}${CALENDAR_UI.DAY_SUFFIX}`).getUTCDay();
  return shiftDay(day, -((weekday + PLANNING.MONDAY_OFFSET) % PLANNING.DAYS));
}
export function weekDays(day: string): readonly string[] {
  return Array.from({ length: PLANNING.DAYS }, (_, index) => shiftDay(weekStart(day), index));
}
export function dateNumber(day: string): string {
  return String(new Date(`${day}${CALENDAR_UI.DAY_SUFFIX}`).getUTCDate());
}
export function weekdayLabel(day: string, short = false): string {
  return new Intl.DateTimeFormat(DEFAULTS.LOCALE, {
    timeZone: CALENDAR_UI.UTC,
    weekday: short ? 'short' : 'long',
  }).format(new Date(`${day}${CALENDAR_UI.DAY_SUFFIX}`));
}
export function weekLabel(day: string): string {
  const format = new Intl.DateTimeFormat(DEFAULTS.LOCALE, {
    timeZone: CALENDAR_UI.UTC,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return format.formatRange(
    new Date(`${weekStart(day)}${CALENDAR_UI.DAY_SUFFIX}`),
    new Date(`${shiftDay(weekStart(day), PLANNING.DAYS - 1)}${CALENDAR_UI.DAY_SUFFIX}`),
  );
}
export function localMinute(iso: string, timezone: string): number {
  const parts = new Intl.DateTimeFormat(CALENDAR_UI.DAY_KEY_LOCALE, {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso));
  return (
    Number(parts.find((part) => part.type === 'hour')?.value ?? 0) * PLANNING.MINUTES_PER_HOUR +
    Number(parts.find((part) => part.type === 'minute')?.value ?? 0)
  );
}
export function currentDay(now: number | null, timezone: string): string {
  return now === null ? '' : localDay(new Date(now).toISOString(), timezone);
}
