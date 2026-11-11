import { MONEY } from '../../config/constants';
export function text(form: FormData, name: string) {
  return String(form.get(name) ?? '').trim();
}
export function cents(value: string): number {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return Number.NaN;
  const [whole, fraction = ''] = normalized.split('.');
  return Number(whole) * MONEY.CENTS_PER_UNIT + Number(fraction.padEnd(MONEY.DECIMAL_PLACES, '0'));
}
