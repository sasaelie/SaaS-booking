import { z } from 'zod';
import { PARTICIPANT } from '../../config/constants';
export const ParticipantCodeSchema = z
  .string()
  .trim()
  .max(PARTICIPANT.CODE_MAX)
  .transform((value) => value.toUpperCase().replace(/\s/g, ''))
  .pipe(z.string().regex(/^(CLI|TEST)-[A-F0-9]{32}-[A-F0-9]{32}$/));
export const ParticipantExchangeSchema = z.object({ code: ParticipantCodeSchema }).strict();
export const ParticipantBookingSchema = z.object({ bookingId: z.uuid() }).strict();
export const ParticipantRecoverySchema = z
  .object({ organizationId: z.uuid(), bookingId: z.uuid() })
  .strict();
export const ParticipantVoucherSchema = z.object({
  id: z.uuid(),
  code: z.string(),
  valueCents: z.number().int().nonnegative(),
  currency: z.string(),
  expiresAtIso: z.iso.datetime(),
  status: z.string(),
});
export const ParticipantTicketSchema = z.object({
  code: ParticipantCodeSchema,
  qrDataUrl: z.string().startsWith('data:image/png;base64,'),
  isSimulation: z.boolean(),
  participantName: z.string(),
  endsAtIso: z.iso.datetime(),
  sessionCancelled: z.boolean(),
  unitPriceCents: z.number().int().nonnegative(),
  amountPaidCents: z.number().int().nonnegative(),
  voucherDiscountCents: z.number().int().nonnegative(),
  currency: z.string(),
  address: z.string().nullable(),
  practicalInfo: z.string(),
  phone: z.string().nullable(),
  socialLinks: z.array(z.object({ label: z.string(), url: z.url() })),
  vouchers: z.array(ParticipantVoucherSchema),
});
export type ParticipantTicket = z.infer<typeof ParticipantTicketSchema>;
