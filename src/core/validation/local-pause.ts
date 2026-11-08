import { z } from 'zod';
import { INPUT_LIMITS } from '../../config/constants';
export const LocalPauseSchema = z
  .object({
    action: z.literal('pause-local'),
    organizationId: z.uuid(),
    activityId: z.uuid(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    reason: z.string().trim().min(1).max(INPUT_LIMITS.TOKEN_MAX),
    confirmCancelExistingBookings: z.boolean(),
    confirmationHash: z.string().length(INPUT_LIMITS.HASH_LENGTH).optional(),
  })
  .refine((input) => input.endDate >= input.date);
