import { HueSchema } from './appearance';
import { z } from 'zod';
import { BOOKING_STATUSES } from '../../config/constants';
import { ParticipantTicketSchema } from './participant';
import { CancellationPreviewSchema } from './cancellation-preview';
export const SelfBookingContextSchema = z.object({
  cancellationPreview: CancellationPreviewSchema.nullable().optional(),
  ticket: ParticipantTicketSchema.nullable().optional(),
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
