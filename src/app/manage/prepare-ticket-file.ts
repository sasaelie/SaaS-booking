import type { SelfBookingContext } from '../../core/validation/self-booking';
import { PARTICIPANT_PDF } from '../../config/participant-pdf';
import { ERROR_CODES } from '../../config/constants';
import { failure } from '../../lib/errors';
export async function prepareTicketFile(booking: SelfBookingContext) {
  try {
    const { participantTicketPdf } = await import('../../composition/participant-ticket-pdf');
    const result = await participantTicketPdf().execute(booking);
    if (!result.ok) return null;
    const file = new Blob([new Uint8Array(result.value).buffer], { type: PARTICIPANT_PDF.MIME });
    return URL.createObjectURL(file);
  } catch {
    failure(ERROR_CODES.INTERNAL_ERROR, 'ParticipantPdf', 'prepare');
    return null;
  }
}
