import { isValidIban } from '../domain/iban';
import { z } from 'zod';
import { SocialLinksSchema } from './event-details';
import { ADMIN_WORKSPACE } from '../../config/administration-workspace';
import {
  ORGANIZATION_KINDS,
  BRAND_THEMES,
  INPUT_LIMITS,
  SAAS,
  PORTAL,
} from '../../config/constants';
export const OrganizationSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(SAAS.SLUG_MIN, PORTAL.SLUG_FORMAT)
  .max(SAAS.SLUG_MAX, PORTAL.SLUG_FORMAT)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, PORTAL.SLUG_FORMAT)
  .refine(
    (slug) => !SAAS.RESERVED_SLUGS.some((reserved) => reserved === slug),
    PORTAL.SLUG_RESERVED,
  );
export const CreateOrganizationSchema = z.object({
  name: z.string().trim().min(INPUT_LIMITS.NAME_MIN).max(INPUT_LIMITS.NAME_MAX),
  slug: OrganizationSlugSchema,
  kind: z.enum(ORGANIZATION_KINDS),
  timezone: z
    .string()
    .min(SAAS.MIN_TIMEZONE_LENGTH)
    .max(INPUT_LIMITS.KEY_MAX)
    .refine((value) => {
      try {
        new Intl.DateTimeFormat('fr-BE', { timeZone: value });
        return true;
      } catch {
        return false;
      }
    }),
});
export const SettingsSchema = z
  .object({
    organizationId: z.uuid(),
    name: z.string().trim().min(INPUT_LIMITS.NAME_MIN).max(INPUT_LIMITS.NAME_MAX),
    bankIban: z
      .string()
      .trim()
      .transform((v) => v.replace(/\s/g, '').toUpperCase())
      .refine((v) => !v || isValidIban(v))
      .nullable(),
    bankAccountName: z.string().trim().max(INPUT_LIMITS.NAME_MAX).nullable(),
    theme: z.enum(BRAND_THEMES),
    autoDeleteBankProof: z.boolean(),
    socialLinks: SocialLinksSchema.optional(),
  })
  .refine((value) => Boolean(value.bankIban) === Boolean(value.bankAccountName));
export const BookingFilterSchema = z.object({
  activityId: z
    .union([z.uuid(), z.literal('')])
    .optional()
    .default(''),
  page: z.coerce.number().int().min(1).default(1),
  search: z.string().trim().max(SAAS.SEARCH_MAX).default(''),
  status: z.string().max(INPUT_LIMITS.KEY_MAX).default(''),
});
export const PlatformFilterSchema = BookingFilterSchema.omit({
  status: true,
  activityId: true,
}).extend({
  page: z.coerce.number().int().min(1).max(ADMIN_WORKSPACE.PAGE_MAX).default(1),
  pageSize: z.coerce
    .number()
    .refine((value) => ADMIN_WORKSPACE.PAGE_SIZES.some((size) => size === value))
    .default(ADMIN_WORKSPACE.PAGE_SIZES[0]),
  status: z
    .enum([
      '',
      'ACTIVE',
      'COMPLIMENTARY',
      'PAST_DUE',
      'SUSPENDED',
      'EXPIRED',
      'INACTIVE',
      'PENDING',
      'RETRY',
    ])
    .default(''),
  plan: z.enum(['', 'LIBERTE', 'PRO']).default(''),
  sort: z.enum(['name', 'newest', 'oldest', 'expiry', 'priority']).default('name'),
  type: z.string().trim().max(INPUT_LIMITS.KEY_MAX).default(''),
});
