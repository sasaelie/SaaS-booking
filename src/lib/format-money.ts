import { DEFAULTS, MONEY } from '../config/constants';
export function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat(DEFAULTS.LOCALE, { style: 'currency', currency }).format(
    cents / MONEY.CENTS_PER_UNIT,
  );
}
