import { z } from 'zod';
import { INPUT_LIMITS } from '../../config/constants';
const local = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
const capacity = z.coerce.number().int().positive().max(INPUT_LIMITS.MAX_CAPACITY);
export const SessionEditSchema = z.object({
  action: z.literal('update-session'),
  organizationId: z.uuid(),
  activityId: z.uuid(),
  startsAt: z.iso.datetime(),
  endsAt: z.iso.datetime(),
  capacity,
  newStart: local,
  newEnd: local,
  newCapacity: capacity,
  confirmCancelExistingBookings: z.boolean().default(false),
  confirmationHash: z.string().length(INPUT_LIMITS.HASH_LENGTH).optional(),
});
export type SessionEditInput = z.output<typeof SessionEditSchema>;
