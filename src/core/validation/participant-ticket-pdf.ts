import { z } from 'zod';
import { SelfBookingContextSchema } from './self-booking';
import { ParticipantTicketSchema } from './participant';
export const ParticipantTicketPdfSchema = SelfBookingContextSchema.extend({
  ticket: ParticipantTicketSchema,
});
export type ParticipantTicketDocument = z.infer<typeof ParticipantTicketPdfSchema>;
