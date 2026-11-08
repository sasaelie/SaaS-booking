import { HueSchema } from './appearance';
import { z } from 'zod';
import { BOOKING_STATUSES } from '../../config/constants';
export const SelfBookingContextSchema = z.object({
  participantHue: HueSchema.nullable().optional(),
  organizationSlug: z.string(),
  organizationName: z.string(),
  activityId: z.uuid(),
  activityName: z.string(),
  startsAtIso: z.string().datetime(),
  timezone: z.string(),
  status: z.enum(BOOKING_STATUSES),
  hasProof: z.boolean(),
  canUploadProof: z.boolean(),
  canCancel: z.boolean(),
});
export type SelfBookingContext = z.infer<typeof SelfBookingContextSchema>;
