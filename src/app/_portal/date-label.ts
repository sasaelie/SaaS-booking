import { DEFAULTS } from '../../config/constants';
export function portalDate(date: Date | string, timezone: string = DEFAULTS.TIMEZONE) {
  return new Intl.DateTimeFormat(DEFAULTS.LOCALE, {
    timeZone: timezone,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}
