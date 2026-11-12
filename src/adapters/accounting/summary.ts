import type ExcelJS from 'exceljs';
import type { AccountingReport } from '../../core/ports/accounting.port';
import { ACCOUNTING as A } from '../../config/accounting';
import { MONEY } from '../../config/constants';
export function summarySheet(book: ExcelJS.Workbook, report: AccountingReport) {
  const sheet = book.addWorksheet(A.SUMMARY);
  sheet.columns = [{ width: A.COLUMN_WIDTH + A.COLUMN_WIDTH }, { width: A.COLUMN_WIDTH }];
  sheet.addRow([report.organizationName]);
  sheet.addRow(['Espace', report.organizationSlug]);
  sheet.addRow(['Export généré', report.generatedAt.toISOString()]);
  sheet.addRow(['Période', 'Tout l’historique disponible — EUR']);
  sheet.addRow([]);
  sheet.addRow(['Indicateur', 'Montant / nombre']);
  const last = Math.max(A.FIRST_ROW, report.payments.length + A.HEADER_ROW);
  const range = (col: string) => `'${A.PAYMENTS}'!${col}${A.FIRST_ROW}:${col}${last}`;
  const formulas = [
    `SUM(${range('E')})`,
    `SUM(${range('F')})`,
    `SUM(${range('G')})-SUM(${range('H')})`,
    `SUM(${range('J')})`,
    `SUM(${range('K')})`,
    `SUM(${range('L')})`,
    `SUM(${range('M')})`,
    `COUNTIFS(${range('N')},"PENDING",${range('F')},">0")+COUNTIFS(${range('N')},"HISTORICAL",${range('F')},">0")`,
    `SUM(${range('I')})`,
    `SUM(${range('E')})-SUM(${range('F')})`,
  ];
  const values = summaryValues(report);
  A.SUMMARY_LABELS.forEach((label, index) => {
    const row = sheet.addRow([label, { formula: formulas[index] ?? '0', result: values[index] ?? 0 }]);
    row.getCell(A.VALUE_COLUMN).numFmt = index === A.COUNT_INDEX ? '0' : A.FORMAT;
    row.height = A.ROW_HEIGHT;
  });
  sheet.getRow(1).font = { bold: true, size: A.TITLE_SIZE, color: { argb: A.COLORS.FOREST } };
  sheet.eachRow((row) => {
    row.getCell(1).alignment = { wrapText: true };
  });
  summaryNote(sheet, report);
}
function summaryNote(sheet: ExcelJS.Worksheet, report: AccountingReport) {
  const pending = report.payments.some(
    (p) => p.paidAt && (p.status !== 'RECONCILED' || p.organizationNetCents === null || p.stripeFeeCents === null),
  );
  sheet.addRow([]);
  sheet.addRow([
    pending
      ? 'Attention : rapprochement incomplet. Les totaux bancaires connus sont partiels.'
      : 'Aucune opération bancaire en attente de rapprochement.',
  ]);
}

function summaryValues(report: AccountingReport) {
  const paid = report.payments.filter((p) => p.paidAt !== null);
  const sum = (values: readonly (number | null)[]) =>
    values.reduce<number>((a, b) => a + (b ?? 0), 0) / MONEY.CENTS_PER_UNIT;
  return [
    sum(report.payments.map((p) => p.publicAmountCents)),
    sum(paid.map((p) => p.publicAmountCents)),
    sum(paid.map((p) => p.commissionCents - p.commissionRefundedCents)),
    sum(paid.filter((p) => p.status === 'RECONCILED').map((p) => p.stripeFeeCents)),
    sum(paid.map((p) => p.refundedCents)),
    sum(paid.filter((p) => p.status === 'RECONCILED').map((p) => p.organizationNetCents)),
    sum(paid.map((p) => p.transferredCents)),
    paid.filter((p) => p.status === 'PENDING' || p.status === 'HISTORICAL').length,
    sum(paid.map((p) => p.commissionTaxCents)),
    sum(report.payments.filter((p) => !p.paidAt).map((p) => p.publicAmountCents)),
  ];
}
