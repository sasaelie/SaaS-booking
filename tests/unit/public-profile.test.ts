import { expect, it } from 'vitest';
import { publicProfile } from '../../src/lib/public-profile';
it('keeps every professional detail blank until it is supplied and never invents a contact', () => {
  expect(publicProfile({})).toEqual({
    name: null,
    address: null,
    businessNumber: null,
    taxStatus: null,
    vatNumber: null,
    email: null,
    phone: null,
  });
});
it('displays valid information progressively without hiding it when another field is missing or invalid', () => {
  expect(
    publicProfile({
      PUBLIC_LEGAL_NAME: 'Atelier fictif',
      PUBLIC_CONTACT_PHONE: '0470 12 34 56',
      PUBLIC_CONTACT_EMAIL: 'invalid',
      PUBLIC_VAT_NUMBER: 'not-a-vat-id',
    }),
  ).toMatchObject({
    name: 'Atelier fictif',
    phone: '+32470123456',
    email: null,
    vatNumber: null,
    address: null,
  });
  expect(publicProfile({ PUBLIC_CONTACT_EMAIL: 'contact@example.com' })).toMatchObject({
    email: 'contact@example.com',
    name: null,
    phone: null,
  });
});
