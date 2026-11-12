import { CONTACT } from '../../config/contact';
export function normalizeContactPhone(value: string): string {
  const compact = value.trim().replace(/[\s().-]/g, '');
  if (compact.startsWith('00')) return '+' + compact.slice('00'.length);
  if (compact.startsWith('0')) return CONTACT.BELGIAN_PREFIX + compact.slice(1);
  return compact;
}
export function isValidContactPhone(value: string): boolean {
  if (!CONTACT.INTERNATIONAL_PATTERN.test(value)) return false;
  return !value.startsWith(CONTACT.BELGIAN_PREFIX) || CONTACT.BELGIAN_PATTERN.test(value);
}
export function contactPhoneHref(value?: string): string | null {
  const phone = normalizeContactPhone(value ?? '');
  return isValidContactPhone(phone) ? `tel:${phone}` : null;
}
