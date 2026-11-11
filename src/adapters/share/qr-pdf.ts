import QRCode from 'qrcode';
const PAGE_POINTS = 600;
const MARGIN_POINTS = 50;
const OBJECT_COUNT = 5;
const SIDES = 2;
const OFFSET_WIDTH = 10;
export function qrPdf(url: string): Uint8Array {
  const matrix = QRCode.create(url, { errorCorrectionLevel: 'M' }).modules;
  const scale = (PAGE_POINTS - MARGIN_POINTS * SIDES) / matrix.size;
  const rectangles: string[] = ['0 g'];
  for (let row = 0; row < matrix.size; row++)
    for (let column = 0; column < matrix.size; column++)
      if (matrix.get(row, column))
        rectangles.push(
          `${MARGIN_POINTS + column * scale} ${PAGE_POINTS - MARGIN_POINTS - (row + 1) * scale} ${scale} ${scale} re f`,
        );
  const stream = rectangles.join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_POINTS} ${PAGE_POINTS}] /Contents 4 0 R >>`,
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${OBJECT_COUNT}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1))
    pdf += `${String(offset).padStart(OFFSET_WIDTH, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${OBJECT_COUNT} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(pdf);
}
