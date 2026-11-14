import { z } from 'zod';
import { ContactPhoneSchema } from '../core/validation/contact-phone';
export const PUBLIC_SITE = {
  ENABLED: 'true',
  PRODUCTION: 'production',
  PATHS: [
    '/',
    '/mentions-legales',
    '/confidentialite',
    '/conditions',
    '/contact',
    '/accessibilite',
    '/faq',
  ],
  PRIVATE_PATHS: [
    '/app',
    '/api',
    '/plateforme',
    '/simulation',
    '/connexion',
    '/inscription',
    '/mot-de-passe-oublie',
    '/nouveau-mot-de-passe',
    '/manage',
    '/booking-result',
    '/embed',
  ],
  ASSET_PATHS: ['/icon.svg', '/opengraph-image'],
  NO_INDEX: 'noindex, nofollow',
  MONTHS_PER_YEAR: 12,
} as const;
export const PublicIdentitySchema = z.object({
  PUBLIC_LEGAL_NAME: z.string().trim().min(1),
  PUBLIC_LEGAL_ADDRESS: z.string().trim().min(1),
  PUBLIC_BUSINESS_NUMBER: z
    .string()
    .trim()
    .regex(/^(?:BE\s?)?[01](?:[.\s]?\d){9}$/),
  PUBLIC_TAX_STATUS: z.string().trim().min(1),
  PUBLIC_VAT_NUMBER: z
    .string()
    .trim()
    .regex(/^BE\s?[01](?:[.\s]?\d){9}$/)
    .optional(),
  PUBLIC_CONTACT_EMAIL: z.email(),
  PUBLIC_CONTACT_PHONE: ContactPhoneSchema.refine((value) => Boolean(value)),
});
export const PublicUrlSchema = z.url().refine((value) => {
  const url = new URL(value);
  return (
    url.protocol === 'https:' &&
    url.pathname === '/' &&
    !url.search &&
    !url.hash &&
    !url.username &&
    !url.password &&
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  );
});
