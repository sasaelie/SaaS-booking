import { z } from 'zod';
import { PLATFORM_BILLING as BILL } from '../../config/platform-billing';
const name = z.string().trim().min(1).max(BILL.MAX_NAME);
const address = z.string().trim().min(1).max(BILL.MAX_TEXT);
const country = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2}$/);
const vatRate = z.number().int().min(0).max(BILL.MAX_RATE);
export const PlatformBillingSettingsSchema = z
  .object({
    legalName: name,
    address,
    country,
    registrationNumber: name,
    vatNumber: z.string().trim().max(BILL.MAX_NAME).default(''),
    email: z.email(),
    taxRateBps: vatRate,
    taxNote: z.string().trim().max(BILL.MAX_TEXT).default(''),
    prefix: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z][A-Z0-9-]{1,14}$/),
  })
  .refine(
    (value) => (value.taxRateBps ? Boolean(value.vatNumber) : Boolean(value.taxNote)),
    'Le régime de TVA doit être précisé.',
  );
export const BillingRecipientSchema = z.object({
  legalName: name,
  address,
  country,
  vatNumber: z.string().trim().max(BILL.MAX_NAME).default(''),
  email: z.union([z.email(), z.literal('')]).default(''),
});
export const PlatformDocumentSourceSchema = z.object({
  id: z.uuid(),
  kind: z.enum(['INVOICE', 'CREDIT']),
});
export const IssuePlatformDocumentSchema = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('INVOICE'),
      sourceId: z.uuid(),
      recipient: BillingRecipientSchema,
      taxRateBps: vatRate,
      taxNote: z.string().trim().max(BILL.MAX_TEXT).default(''),
      confirmed: z.literal(true),
    })
    .refine(
      (value) => value.taxRateBps > 0 || Boolean(value.taxNote),
      'La mention de TVA est requise.',
    ),
  z.object({ kind: z.literal('CREDIT'), sourceId: z.uuid(), confirmed: z.literal(true) }),
]);
export type PlatformBillingSettings = z.output<typeof PlatformBillingSettingsSchema>;
export type BillingRecipient = z.output<typeof BillingRecipientSchema>;
export type IssuePlatformDocument = z.output<typeof IssuePlatformDocumentSchema>;
export type PlatformDocumentSourceInput = z.output<typeof PlatformDocumentSourceSchema>;
