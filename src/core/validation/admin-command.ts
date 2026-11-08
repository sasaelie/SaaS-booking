import { z } from 'zod';
import { INPUT_LIMITS } from '../../config/constants';
const base = { organizationId: z.uuid() };
const confirmation = {
  confirmCancelExistingBookings: z.boolean(),
  confirmationHash: z.string().length(INPUT_LIMITS.HASH_LENGTH).optional(),
  reason: z.string().trim().min(1).max(INPUT_LIMITS.TOKEN_MAX),
};
export const AdminCommandSchema = z.discriminatedUnion('action', [
  z.object({
    ...base,
    ...confirmation,
    action: z.literal('close'),
    sessionId: z.uuid(),
  }),
  z.object({
    ...base,
    ...confirmation,
    action: z.literal('pause'),
    activityId: z.uuid(),
    startsAt: z.iso.datetime().transform((value) => new Date(value)),
    endsAt: z.iso.datetime().transform((value) => new Date(value)),
  }),
  z.object({
    ...base,
    action: z.literal('review-bank'),
    bookingId: z.uuid(),
    decision: z.enum(['APPROVE', 'REJECT']),
  }),
  z.object({ ...base, action: z.literal('view-proof'), bookingId: z.uuid() }),
  z.object({
    ...base,
    action: z.literal('cancel'),
    bookingId: z.uuid(),
    adminOverride: z.boolean(),
  }),
  z.object({
    ...base,
    action: z.literal('external-benefit'),
    code: z.string().min(1).max(INPUT_LIMITS.KEY_MAX),
  }),
  z.object({ ...base, action: z.literal('privacy'), bookingId: z.uuid() }),
]);
export type AdminCommand = z.infer<typeof AdminCommandSchema>;
