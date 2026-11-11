import { z } from 'zod';
import { INPUT_LIMITS } from '../../config/constants';
export const BookingJobSchema = z.object({ bookingId: z.uuid() });
export const CancellationJobSchema = BookingJobSchema.extend({
  reason: z.string().trim().max(INPUT_LIMITS.TOKEN_MAX).optional(),
});
export const ReminderJobSchema = BookingJobSchema.extend({ startsAt: z.iso.datetime() });
export const VoucherJobSchema = z.object({ voucherId: z.uuid() });
export const PurgeJobSchema = z.object({
  bookingId: z.uuid(),
  onlyIfUnattached: z.boolean().optional(),
  storageKey: z.string().min(1).max(INPUT_LIMITS.TOKEN_MAX),
});
export const RefundJobSchema = BookingJobSchema.extend({
  chargeModel: z.enum(['DIRECT', 'DESTINATION']).optional(),
  paymentReference: z.string().startsWith('pi_'),
  amountCents: z.number().int().positive().max(INPUT_LIMITS.MAX_CENTS),
  merchantAccountId: z.string().nullable(),
  idempotencyKey: z.string().min(1),
});
