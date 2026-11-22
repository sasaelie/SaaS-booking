import { z } from 'zod';
export const BookingPublicationInput = z.object({ organizationId: z.uuid() });
export const PublishTestBookingInput = BookingPublicationInput.extend({
  acknowledged: z.literal(true),
});
