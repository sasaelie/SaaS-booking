import { CALENDAR_UI, DEFAULTS, TIME } from '../../config/constants';
export function localDay(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat(CALENDAR_UI.DAY_KEY_LOCALE, {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}
export function monthOf(day: string): string {
  return day.slice(0, CALENDAR_UI.MONTH_LENGTH);
}
export function shiftMonth(month: string, direction: number): string {
  const date = new Date(`${month}${CALENDAR_UI.DATE_SUFFIX}`);
  date.setUTCMonth(date.getUTCMonth() + direction);
  return monthOf(localDay(date.toISOString(), CALENDAR_UI.UTC));
}
export function monthDays(month: string): readonly (string | null)[] {
  const first = new Date(`${month}${CALENDAR_UI.DATE_SUFFIX}`);
  const offset = (first.getUTCDay() + CALENDAR_UI.MONDAY_OFFSET) % TIME.DAYS_PER_WEEK;
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0));
  return [
    ...Array.from({ length: offset }, () => null),
    ...Array.from(
      { length: last.getUTCDate() },
      (_, index) => `${month}-${String(index + 1).padStart(CALENDAR_UI.TWO_DIGITS, '0')}`,
    ),
  ];
}
export function dayLabel(day: string): string {
  return new Intl.DateTimeFormat(DEFAULTS.LOCALE, {
    timeZone: CALENDAR_UI.UTC,
    dateStyle: 'full',
  }).format(new Date(`${day}${CALENDAR_UI.DAY_SUFFIX}`));
}
export function monthLabel(month: string): string {
  return new Intl.DateTimeFormat(DEFAULTS.LOCALE, {
    timeZone: CALENDAR_UI.UTC,
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${month}${CALENDAR_UI.DATE_SUFFIX}`));
}
export function timeLabel(iso: string, timezone: string): string {
  return new Intl.DateTimeFormat(DEFAULTS.LOCALE, {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}
