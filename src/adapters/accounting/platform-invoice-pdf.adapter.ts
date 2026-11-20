import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type {
  PlatformInvoicePdfPort,
  PlatformDocumentSnapshot,
} from '../../core/ports/platform-billing';
import { TicketPdfWriter } from '../participant/pdf-writer';
import { PARTICIPANT_PDF as PDF } from '../../config/participant-pdf';
import { PLATFORM_BILLING as UI } from '../../config/platform-billing';
import { PLATFORM_REPORTING } from '../../config/platform-reporting';
import { formatMoney } from '../../lib/format-money';
import { guardUseCase } from '../../lib/guard-use-case';
import { ok } from '../../lib/result';
export class PlatformInvoicePdfAdapter implements PlatformInvoicePdfPort {
  constructor(
    private readonly fontBytes: () => Promise<Uint8Array>,
    private readonly testDocument = false,
  ) {}
  build(snapshot: PlatformDocumentSnapshot) {
    return guardUseCase('PlatformInvoicePdf', 'build', async () => {
      const doc = await PDFDocument.create();
      doc.registerFontkit(fontkit);
      const font = await doc.embedFont(await this.fontBytes(), { subset: true });
      const writer = new TicketPdfWriter(doc, font);
      const date = new Intl.DateTimeFormat('fr-BE', {
        timeZone: PLATFORM_REPORTING.TIMEZONE,
        dateStyle: 'long',
      });
      doc.setTitle(snapshot.number);
      doc.setAuthor(snapshot.issuer.legalName);
      doc.setCreationDate(new Date(snapshot.issuedAt));
      if (this.testDocument) writer.text(UI.TEST_LABEL, PDF.SMALL);
      writer.text(
        `${snapshot.kind === 'INVOICE' ? UI.INVOICE : UI.CREDIT} ${snapshot.number}`,
        PDF.TITLE,
      );
      writer.text(`${UI.ISSUED} : ${date.format(new Date(snapshot.issuedAt))}`, PDF.SMALL);
      issuerText(writer, snapshot);
      recipientText(writer, snapshot);
      writer.text(snapshot.kind === 'INVOICE' ? UI.DESCRIPTION : UI.CREDIT_DESCRIPTION);
      writer.text(
        `${UI.SERVICE_DATE} : ${date.format(new Date(snapshot.sourceOccurredAt))}`,
        PDF.SMALL,
      );
      if (snapshot.originalNumber)
        writer.text(`${UI.ORIGINAL} : ${snapshot.originalNumber}`, PDF.SMALL);
      if (snapshot.sourceReference) writer.text(snapshot.sourceReference, PDF.SMALL);
      writer.text(`${UI.NET} : ${formatMoney(snapshot.netCents, UI.CURRENCY)}`);
      writer.text(
        `${UI.TAX} (${snapshot.taxRateBps / UI.PERCENT_FACTOR} %) : ${formatMoney(snapshot.taxCents, UI.CURRENCY)}`,
      );
      writer.text(`${UI.GROSS} : ${formatMoney(snapshot.grossCents, UI.CURRENCY)}`, PDF.TITLE);
      if (snapshot.taxNote) writer.text(snapshot.taxNote, PDF.SMALL);
      if (snapshot.kind === 'INVOICE') writer.text(UI.PAID, PDF.SMALL);
      return ok(await doc.save());
    });
  }
}
function issuerText(writer: TicketPdfWriter, snapshot: PlatformDocumentSnapshot) {
  const issuer = snapshot.issuer;
  writer.text(issuer.legalName);
  writer.text(`${issuer.address}\n${issuer.country}`, PDF.SMALL);
  writer.text(`${UI.REGISTRATION} : ${issuer.registrationNumber}`, PDF.SMALL);
  if (issuer.vatNumber) writer.text(`${UI.VAT_NUMBER} : ${issuer.vatNumber}`, PDF.SMALL);
  writer.text(issuer.email, PDF.SMALL);
}
function recipientText(writer: TicketPdfWriter, snapshot: PlatformDocumentSnapshot) {
  writer.text(`${UI.RECIPIENT} : ${snapshot.recipient.legalName}`);
  writer.text(`${snapshot.recipient.address}\n${snapshot.recipient.country}`, PDF.SMALL);
  if (snapshot.recipient.vatNumber)
    writer.text(`${UI.VAT_NUMBER} : ${snapshot.recipient.vatNumber}`, PDF.SMALL);
  if (snapshot.recipient.email) writer.text(snapshot.recipient.email, PDF.SMALL);
}
