import { z } from 'zod';
import { PLATFORM_SETTINGS as UI } from '../../config/platform-settings';
import { PublicIdentitySchema } from '../../config/public-site';
import { ContactPhoneSchema } from './contact-phone';
import { SocialLinksSchema } from './event-details';
const text = z.string().trim().max(UI.LEGAL_MAX).default('');
const optionalNumber = (schema: z.ZodType<string>) => z.union([schema, z.literal('')]).default('');
export const PlatformPublicProfileSchema = z
  .object({
    name: text,
    address: z.string().trim().max(UI.ADDRESS_MAX).default(''),
    businessNumber: optionalNumber(PublicIdentitySchema.shape.PUBLIC_BUSINESS_NUMBER),
    vatNumber: optionalNumber(PublicIdentitySchema.shape.PUBLIC_VAT_NUMBER.unwrap()),
    taxStatus: z.string().trim().max(UI.TAX_MAX).default(''),
    email: z.union([z.email(), z.literal('')]).default(''),
    phone: ContactPhoneSchema.default(''),
    socialLinks: SocialLinksSchema.omit({ phone: true }).default({}),
  })
  .strict();
export const PlatformConnectionSchema = z
  .object({
    provider: z.enum(['NONE', 'BILLIT', 'ODOO', 'OTHER']).default('NONE'),
    participantId: z
      .string()
      .trim()
      .max(UI.PARTICIPANT_MAX)
      .regex(/^(?:\d{4}:[A-Za-z0-9._-]+)?$/)
      .default(''),
  })
  .strict();
export const PlatformRevisionSchema = z.number().int().min(0).max(UI.REVISION_MAX);
export const PlatformSettingsCommandSchema = z.discriminatedUnion('action', [
  z
    .object({
      action: z.literal('save'),
      revision: PlatformRevisionSchema,
      profile: PlatformPublicProfileSchema,
    })
    .strict(),
  z.object({ action: z.enum(['publish', 'unpublish']), revision: PlatformRevisionSchema }).strict(),
  z
    .object({
      action: z.literal('connection'),
      revision: PlatformRevisionSchema,
      connection: PlatformConnectionSchema,
    })
    .strict(),
]);
export type PlatformPublicProfile = z.output<typeof PlatformPublicProfileSchema>;
export type PlatformConnection = z.output<typeof PlatformConnectionSchema>;
export type PlatformSettingsCommand = z.output<typeof PlatformSettingsCommandSchema>;
