import { expect, it } from 'vitest';
import { isMarketingPath, isPublicSearchPath, publicSiteSettings } from '../../src/lib/public-site';
import { CreateOrganizationSchema } from '../../src/core/validation/portal-organization';
const complete = {
  APP_ENVIRONMENT: 'production',
  VERCEL_ENV: 'production',
  SEARCH_INDEXING_ENABLED: 'true',
  PUBLIC_SITE_URL: 'https://booking.example.com',
  PUBLIC_LEGAL_NAME: 'Exemple de société',
  PUBLIC_LEGAL_ADDRESS: 'Adresse fictive, Belgique',
  PUBLIC_BUSINESS_NUMBER: '0123.456.749',
  PUBLIC_TAX_STATUS: 'Régime fictif pour le test',
  PUBLIC_CONTACT_EMAIL: 'support@example.com',
  PUBLIC_CONTACT_PHONE: '+32 470 12 34 56',
};
it('requires deliberate production publication, professional identification and a public HTTPS origin', () => {
  expect(publicSiteSettings(complete).indexable).toBe(true);
  for (const key of Object.keys(complete))
    expect(publicSiteSettings({ ...complete, [key]: undefined }).indexable).toBe(
      key === 'VERCEL_ENV',
    );
  expect(publicSiteSettings({ ...complete, APP_ENVIRONMENT: 'staging' }).indexable).toBe(false);
  expect(publicSiteSettings({ ...complete, VERCEL_ENV: 'preview' }).indexable).toBe(false);
  expect(publicSiteSettings({ ...complete, SEARCH_INDEXING_ENABLED: 'false' }).indexable).toBe(
    false,
  );
  expect(publicSiteSettings({}).indexable).toBe(false);
});
it('refuses credentials, local origins, paths and invalid professional contact data', () => {
  for (const PUBLIC_SITE_URL of [
    'http://booking.example.com',
    'https://localhost',
    'https://127.0.0.1',
    'https://[::1]',
    'https://name:secret@booking.example.com',
    'https://booking.example.com/app',
    'https://booking.example.com/?key=value',
  ])
    expect(publicSiteSettings({ ...complete, PUBLIC_SITE_URL }).baseUrl).toBeNull();
  expect(
    publicSiteSettings({ ...complete, PUBLIC_CONTACT_EMAIL: 'javascript:invalid' }).email,
  ).toBeNull();
  expect(
    publicSiteSettings({ ...complete, PUBLIC_CONTACT_PHONE: 'not-a-phone' }).identity,
  ).toBeNull();
  expect(
    publicSiteSettings({ ...complete, PUBLIC_BUSINESS_NUMBER: '0.........' }).identity,
  ).toBeNull();
});
it('allows a contact address before publication without inventing the missing legal identity', () => {
  expect(publicSiteSettings({ PUBLIC_CONTACT_EMAIL: 'support@example.com' })).toMatchObject({
    email: 'support@example.com',
    identity: null,
    indexable: false,
    baseUrl: null,
  });
});
it('lists only deliberate brochure paths, excluding account and participant tokens', () => {
  for (const asset of ['/icon.svg', '/opengraph-image']) {
    expect(isPublicSearchPath(asset)).toBe(true);
    expect(isMarketingPath(asset)).toBe(false);
  }
  for (const path of ['/', '/contact', '/mentions-legales', '/confidentialite'])
    expect(isMarketingPath(path)).toBe(true);
  for (const path of [
    '/app',
    '/api',
    '/simulation',
    '/mon-organisation',
    '/annuler/token',
    '/contact/fake',
  ])
    expect(isPublicSearchPath(path)).toBe(false);
});
it('refuses organization links that would collide with the new public brochure pages', () => {
  for (const slug of [
    'contact',
    'conditions',
    'confidentialite',
    'mentions-legales',
    'accessibilite',
    'opengraph-image',
    'faq',
  ])
    expect(
      CreateOrganizationSchema.safeParse({
        name: 'Club',
        slug,
        kind: 'CLUB',
        timezone: 'Europe/Brussels',
      }).success,
    ).toBe(false);
});
