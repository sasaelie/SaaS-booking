import { PDFDocument, type PDFFont, type PDFImage, rgb } from 'pdf-lib';
import { PARTICIPANT_PDF as PDF } from '../../config/participant-pdf';
export class TicketPdfWriter {
  private page;
  private y = PDF.PAGE[1] - PDF.MARGIN;
  constructor(
    private readonly doc: PDFDocument,
    private readonly font: PDFFont,
  ) {
    this.page = doc.addPage([...PDF.PAGE]);
  }
  text(value: string, size: number = PDF.BODY) {
    for (const line of wrap(value, this.font, size, PDF.PAGE[0] - PDF.MARGIN * PDF.SIDES)) {
      this.reserve(size * PDF.LINE_RATIO);
      this.page.drawText(line, {
        x: PDF.MARGIN,
        y: this.y - size,
        size,
        font: this.font,
        color: rgb(...PDF.RGB),
      });
      this.y -= size * PDF.LINE_RATIO;
    }
    this.y -= PDF.GAP;
  }
  qr(image: PDFImage) {
    this.reserve(PDF.QR_SIZE + PDF.GAP);
    this.page.drawImage(image, {
      x: (PDF.PAGE[0] - PDF.QR_SIZE) / PDF.SIDES,
      y: this.y - PDF.QR_SIZE,
      width: PDF.QR_SIZE,
      height: PDF.QR_SIZE,
    });
    this.y -= PDF.QR_SIZE + PDF.GAP;
  }
  private reserve(height: number) {
    if (this.y - height >= PDF.MARGIN) return;
    this.page = this.doc.addPage([...PDF.PAGE]);
    this.y = PDF.PAGE[1] - PDF.MARGIN;
  }
}
function wrap(value: string, font: PDFFont, size: number, width: number) {
  const lines: string[] = [];
  let line = '';
  for (const char of value) {
    if (char === '\n') {
      lines.push(line);
      line = '';
      continue;
    }
    if (line && font.widthOfTextAtSize(line + char, size) > width) {
      const space = line.lastIndexOf(' ');
      lines.push(space > 0 ? line.slice(0, space) : line);
      line = space > 0 ? line.slice(space + 1) : '';
    }
    line += char;
  }
  if (line) lines.push(line);
  return lines;
}
