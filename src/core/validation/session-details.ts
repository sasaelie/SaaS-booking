import { z } from 'zod';
export const SessionDetailsSchema = z.object({
  organizationId: z.uuid(),
  activityId: z.uuid(),
  startsAt: z.iso.datetime(),
  page: z.coerce.number().int().positive().default(1),
});
export type SessionDetailsInput = z.infer<typeof SessionDetailsSchema>;
