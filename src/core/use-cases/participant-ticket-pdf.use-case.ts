import type { ParticipantTicketPdfPort } from '../ports/participant-ticket-pdf.port';
import { ParticipantTicketPdfSchema } from '../validation/participant-ticket-pdf';
import { ERROR_CODES } from '../../config/constants';
import { failure } from '../../lib/errors';
import { guardUseCase } from '../../lib/guard-use-case';
export class ParticipantTicketPdfUseCase {
  constructor(private readonly pdf: ParticipantTicketPdfPort) {}
  execute(raw: unknown) {
    return guardUseCase('ParticipantPdf', 'render', async () => {
      const parsed = ParticipantTicketPdfSchema.safeParse(raw);
      return parsed.success
        ? this.pdf.render(parsed.data, new Date())
        : failure(ERROR_CODES.VALIDATION_FAILED, 'ParticipantPdf', 'input');
    });
  }
}
