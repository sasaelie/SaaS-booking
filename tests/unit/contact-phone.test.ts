import { expect, it } from 'vitest';
import { ContactPhoneSchema } from '../../src/core/validation/contact-phone';
import { contactPhoneHref } from '../../src/core/domain/contact-phone';
it.each([
  ['0470 12 34 56', '+32470123456'],
  ['02 123 45 67', '+3221234567'],
  ['0033 6 12 34 56 78', '+33612345678'],
  ['+44 (20) 1234-5678', '+442012345678'],
  ['', ''],
])('normalizes contact %s', (value, expected) => {
  expect(ContactPhoneSchema.parse(value)).toBe(expected);
});
it.each(['abc', '123', '04701234567890', '+320470123456', 'javascript:alert(1)', '+1234567890123456', '+000000000'])(
  'rejects invalid or executable contact %s',
  (value) => {
    expect(ContactPhoneSchema.safeParse(value).success).toBe(false);
    expect(contactPhoneHref(value)).toBeNull();
  },
);
it('produces only an explicit call link for a valid number', () => {
  expect(contactPhoneHref('0470 12 34 56')).toBe('tel:+32470123456');
  expect(contactPhoneHref()).toBeNull();
});
