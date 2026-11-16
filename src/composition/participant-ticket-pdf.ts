import { ParticipantTicketPdfUseCase } from '../core/use-cases/participant-ticket-pdf.use-case';
import { TicketPdfAdapter } from '../adapters/participant/ticket-pdf.adapter';
import { PARTICIPANT_PDF } from '../config/participant-pdf';
export function participantTicketPdf() {
  return new ParticipantTicketPdfUseCase(
    new TicketPdfAdapter(async () => {
      const response = await fetch(PARTICIPANT_PDF.FONT_URL, {
        signal: AbortSignal.timeout(PARTICIPANT_PDF.FONT_TIMEOUT_MS),
      });
      if (!response.ok) throw Error('PDF font unavailable');
      return new Uint8Array(await response.arrayBuffer());
    }),
  );
}
