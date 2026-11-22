import { z } from 'zod';
import { INPUT_LIMITS } from '../../config/constants';
import { RECORDED_PAYMENT } from '../../config/recorded-payment';
export const RecordedPaymentSchema = z.object({
  organizationId: z.uuid(),
  bookingId: z.uuid(),
  amountCents: z.number().int().positive().max(INPUT_LIMITS.MAX_CENTS),
  method: z.enum(RECORDED_PAYMENT.METHODS),
  reference: z.string().trim().min(1).max(INPUT_LIMITS.KEY_MAX),
  confirmed: z.literal(true),
});
export type RecordedPaymentInput = z.output<typeof RecordedPaymentSchema>;
