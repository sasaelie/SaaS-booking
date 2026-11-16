import { z } from 'zod';
export const BookingNotificationSchema = z
  .object({
    organizationId: z.uuid(),
    bookingId: z.uuid(),
  })
  .strict();
