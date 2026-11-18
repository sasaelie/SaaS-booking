import { expect, it } from 'vitest';
import {
  PlatformSettingsCommandSchema,
  PlatformPublicProfileSchema,
  PlatformConnectionSchema,
} from '../../src/core/validation/platform-settings';
it('keeps every public contact optional and normalizes valid Belgian phone numbers', () => {
  expect(PlatformPublicProfileSchema.parse({}).email).toBe('');
  expect(PlatformPublicProfileSchema.parse({ phone: '0470 12 34 56' }).phone).toBe('+32470123456');
});
it.each([
  'javascript:alert(1)',
  'data:text/html,hello',
  'https://user:secret@example.com',
  'http://example.com',
])('rejects unsafe public social URL %s', (website) => {
  expect(PlatformPublicProfileSchema.safeParse({ socialLinks: { website } }).success).toBe(false);
});
it('rejects privilege fields, forged publication snapshots and unbounded revisions', () => {
  expect(
    PlatformSettingsCommandSchema.safeParse({
      action: 'save',
      revision: 0,
      profile: {},
      published: { email: 'attacker@example.com' },
    }).success,
  ).toBe(false);
  expect(PlatformPublicProfileSchema.safeParse({ role: 'admin' }).success).toBe(false);
  expect(PlatformSettingsCommandSchema.safeParse({ action: 'publish', revision: -1 }).success).toBe(
    false,
  );
});
it('prepares a connection identifier without accepting secrets or arbitrary endpoints', () => {
  expect(
    PlatformConnectionSchema.parse({ provider: 'BILLIT', participantId: '0208:0123456789' })
      .provider,
  ).toBe('BILLIT');
  expect(
    PlatformConnectionSchema.safeParse({ apiKey: 'secret', endpoint: 'http://127.0.0.1' }).success,
  ).toBe(false);
});
