import type ExcelJS from 'exceljs';
import { ACCOUNTING as A } from '../../config/accounting';
import type { AccountingReport } from '../../core/ports/accounting.port';
import { paymentCells, entryCells } from './rows';
export function tableSheet(
  book: ExcelJS.Workbook,
  name: string,
  headers: readonly string[],
  rows: readonly (string | number)[][],
  report: AccountingReport,
) {
  const sheet = book.addWorksheet(name, {
    views: [{ state: 'frozen', ySplit: A.HEADER_ROW }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  sheet.addRow([report.organizationName]);
  sheet.addRow([`Export du ${report.generatedAt.toISOString()} — EUR`]);
  sheet.addRow([]);
  sheet.addRow([...headers]);
  for (const row of rows) sheet.addRow(row);
  if (!rows.length)
    sheet.addRow(headers.map((_, i) => (i === 0 ? 'Aucune opération' : headers[i]?.endsWith(' (€)') ? 0 : '')));
  sheet.autoFilter = {
    from: { row: A.HEADER_ROW, column: 1 },
    to: { row: sheet.rowCount, column: headers.length },
  };
  sheet.columns.forEach((column) => {
    column.width = A.COLUMN_WIDTH;
  });
  sheet.getRow(1).font = { bold: true, size: A.TITLE_SIZE, color: { argb: A.COLORS.FOREST } };
  sheet.getRow(A.HEADER_ROW).height = A.ROW_HEIGHT;
  sheet.getRow(A.HEADER_ROW).eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: A.COLORS.FOREST } };
    cell.font = { bold: true, color: { argb: A.COLORS.WHITE } };
    cell.alignment = { wrapText: true, vertical: 'middle' };
  });
  sheet.eachRow((row, index) => {
    if (index > A.HEADER_ROW)
      row.eachCell((cell) => {
        if (typeof cell.value === 'number') cell.numFmt = A.FORMAT;
      });
  });
  return sheet;
}
export function detailSheets(book: ExcelJS.Workbook, report: AccountingReport) {
  tableSheet(book, A.PAYMENTS, A.HEADERS, report.payments.map(paymentCells), report);
  tableSheet(book, A.ENTRIES, A.JOURNAL_HEADERS, report.entries.map(entryCells), report);
  const guide = book.addWorksheet(A.GUIDE);
  guide.getColumn(1).width = A.COLUMN_WIDTH * A.GUIDE_LINES.length;
  for (const line of A.GUIDE_LINES) {
    const row = guide.addRow([line]);
    row.alignment = { wrapText: true };
    row.height = A.ROW_HEIGHT;
  }
}
