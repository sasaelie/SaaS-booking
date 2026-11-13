import { afterEach, expect, it, vi } from 'vitest';
import robots from '../../src/app/robots';
import sitemap from '../../src/app/sitemap';
import { publicMetadata } from '../../src/app/_marketing/public-metadata';
afterEach(() => vi.unstubAllEnvs());
function publish() {
  const environment = {
    APP_ENVIRONMENT: 'production',
    VERCEL_ENV: 'production',
    SEARCH_INDEXING_ENABLED: 'true',
    PUBLIC_SITE_URL: 'https://booking.example.com',
    PUBLIC_LEGAL_NAME: 'Exemple fictif',
    PUBLIC_LEGAL_ADDRESS: 'Adresse fictive, Belgique',
    PUBLIC_BUSINESS_NUMBER: '0123.456.749',
    PUBLIC_TAX_STATUS: 'Régime fictif',
    PUBLIC_CONTACT_EMAIL: 'support@example.com',
    PUBLIC_CONTACT_PHONE: '+32 470 12 34 56',
  };
  for (const [key, value] of Object.entries(environment)) vi.stubEnv(key, value);
}
it('indexes only the deliberate public brochure on the confirmed production domain', () => {
  publish();
  expect(robots()).toMatchObject({
    sitemap: 'https://booking.example.com/sitemap.xml',
    rules: { disallow: expect.arrayContaining(['/app', '/api', '/simulation']) },
  });
  expect(sitemap().map(({ url }) => url)).toEqual([
    'https://booking.example.com/',
    'https://booking.example.com/mentions-legales',
    'https://booking.example.com/confidentialite',
    'https://booking.example.com/conditions',
    'https://booking.example.com/contact',
    'https://booking.example.com/accessibilite',
    'https://booking.example.com/faq',
  ]);
  expect(publicMetadata('Titre', 'Description', '/contact')).toMatchObject({
    robots: { index: true, follow: true },
    alternates: { canonical: 'https://booking.example.com/contact' },
  });
});
it('keeps staging unindexable even if production publication settings are accidentally copied', () => {
  publish();
  vi.stubEnv('APP_ENVIRONMENT', 'staging');
  expect(robots()).toEqual({ rules: { userAgent: '*', disallow: '/' } });
  expect(sitemap()).toEqual([]);
  expect(publicMetadata('Titre', 'Description')).toMatchObject({
    robots: { index: false, follow: false },
  });
});
