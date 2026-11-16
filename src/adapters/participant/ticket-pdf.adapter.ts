import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { ParticipantTicketPdfPort } from '../../core/ports/participant-ticket-pdf.port';
import type { ParticipantTicketDocument } from '../../core/validation/participant-ticket-pdf';
import {
  participantTicketAmounts,
  participantTicketStatus,
} from '../../core/domain/participant-ticket';
import { DEFAULTS, PARTICIPANT_UI as UI } from '../../config/constants';
import { PARTICIPANT_PDF as PDF } from '../../config/participant-pdf';
import { formatMoney } from '../../lib/format-money';
import { guardUseCase } from '../../lib/guard-use-case';
import { ok } from '../../lib/result';
import { TicketPdfWriter } from './pdf-writer';
export class TicketPdfAdapter implements ParticipantTicketPdfPort {
  constructor(private readonly fontBytes: () => Promise<Uint8Array>) {}
  render(booking: ParticipantTicketDocument, now: Date) {
    return guardUseCase('ParticipantPdf', 'encode', async () => {
      const doc = await PDFDocument.create();
      doc.registerFontkit(fontkit);
      const font = await doc.embedFont(await this.fontBytes(), { subset: true });
      const writer = new TicketPdfWriter(doc, font);
      const ticket = booking.ticket;
      doc.setTitle(UI.TICKET);
      if (ticket.isSimulation) writer.text(UI.TEST);
      writer.text(UI.TICKET, PDF.SMALL);
      writer.text(booking.activityName, PDF.TITLE);
      writer.text(booking.organizationName);
      writer.text(ticket.participantName);
      writer.text(
        new Intl.DateTimeFormat(DEFAULTS.LOCALE, {
          timeZone: booking.timezone,
          dateStyle: 'full',
          timeStyle: 'short',
        }).format(new Date(booking.startsAtIso)),
      );
      writer.text(participantTicketStatus(booking, now).label);
      for (const amount of participantTicketAmounts(booking))
        writer.text(`${amount.label} : ${formatMoney(amount.value, ticket.currency)}`);
      if (ticket.address) writer.text(ticket.address);
      writer.qr(await doc.embedPng(ticket.qrDataUrl));
      writer.text(UI.CODE, PDF.SMALL);
      writer.text(ticket.code, PDF.SMALL);
      writer.text(UI.PRIVATE, PDF.SMALL);
      writer.text(PDF.NOTE, PDF.SMALL);
      return ok(await doc.save());
    });
  }
}
