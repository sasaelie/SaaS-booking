import type { Result } from '../../lib/result';
import type { ParticipantTicketDocument } from '../validation/participant-ticket-pdf';
export interface ParticipantTicketPdfPort {
  render(booking: ParticipantTicketDocument, now: Date): Promise<Result<Uint8Array>>;
}
