import { z } from 'zod';
export const ManualVoucherSchema = z.object({
  organizationId: z.uuid(),
  bookingId: z.uuid(),
  expiresAt: z.iso.datetime(),
  confirmed: z.literal(true),
});
export type ManualVoucherInput = z.output<typeof ManualVoucherSchema>;
