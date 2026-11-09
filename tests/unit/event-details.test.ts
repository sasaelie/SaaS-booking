import { expect, it } from 'vitest';
import { SocialLinksSchema, EventDetailsSchema } from '../../src/core/validation/event-details';
it('accepts optional HTTPS social links and rejects executable, credentialed and unknown URLs', () => {
  expect(
    SocialLinksSchema.safeParse({ whatsapp: 'https://wa.me/32400000000', instagram: '' }).success,
  ).toBe(true);
  for (const url of ['javascript:alert(1)', 'http://facebook.com', 'https://secret@facebook.com'])
    expect(SocialLinksSchema.safeParse({ facebook: url }).success).toBe(false);
  expect(SocialLinksSchema.safeParse({ unknown: 'https://example.com' }).success).toBe(false);
});
it('preserves backward-compatible public defaults and validates private-address mode', () => {
  expect(EventDetailsSchema.parse({}).addressVisibility).toBe('PUBLIC');
  expect(EventDetailsSchema.safeParse({ addressVisibility: 'HIDDEN' }).success).toBe(false);
  expect(
    EventDetailsSchema.parse({ address: '  Rue Exemple 12  ', addressVisibility: 'REMINDER' })
      .address,
  ).toBe('Rue Exemple 12');
});
