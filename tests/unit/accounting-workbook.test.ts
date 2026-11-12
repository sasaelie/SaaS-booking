import { expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { AccountingWorkbookAdapter } from '../../src/adapters/accounting/workbook.adapter';
import { required } from '../../src/adapters/db/transaction';
import type { AccountingPayment, AccountingReport } from '../../src/core/ports/accounting.port';
import { paymentCells } from '../../src/adapters/accounting/rows';
const report: AccountingReport = {
  organizationName: 'Atelier exemple',
  organizationSlug: 'atelier',
  generatedAt: new Date('2026-11-12T12:00:00Z'),
  payments: [],
  entries: [],
};
function payment(extra: Partial<AccountingPayment> = {}): AccountingPayment {
  return {
    bookingId: 'r1',
    commercialPlan: 'LIBERTE',
    currency: 'EUR',
    pricingVersion: 'v1',
    publicAmountCents: 3000,
    commissionCents: 150,
    commissionRefundedCents: 0,
    commissionTaxCents: null,
    stripeFeeCents: null,
    organizationNetCents: 2850,
    refundedCents: 0,
    transferredCents: null,
    status: 'PENDING',
    paidAt: new Date(),
    createdAt: new Date(),
    paymentReference: 'pi_1',
    balanceTransactionId: null,
    transferId: null,
    payoutId: null,
    payoutStatus: null,
    ...extra,
  };
}
it('produces a complete empty workbook with labels, zero cached totals and working formulas', async () => {
  const bytes = required(await new AccountingWorkbookAdapter().build(report));
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(new Uint8Array(bytes).buffer);
  expect(book.worksheets.map((s) => s.name)).toEqual(['Synthèse', 'Réservations', 'Journal', 'Mode d’emploi']);
  const summary = book.getWorksheet('Synthèse');
  expect(summary?.getCell('A1').value).toBe('Atelier exemple');
  expect(summary?.getCell('B8').formula).toBe("SUM('Réservations'!F5:F5)");
  const zip = await JSZip.loadAsync(bytes);
  const xml = await zip.file('xl/worksheets/sheet1.xml')?.async('string');
  expect(xml).toContain('<f>SUM(&apos;Réservations&apos;!F5:F5)</f><v>0</v>');
  expect(book.getWorksheet('Réservations')?.getCell('E4').value).toBe('Prix réservé (€)');
});
it('does not report unpaid reservations as received or pending fees as zero', () => {
  const row = paymentCells(payment({ paidAt: null }));
  expect(row[5]).toBe(0);
  expect(row[9]).toBe('Non encaissé');
  const paid = paymentCells(payment());
  expect(paid[5]).toBe(30);
  expect(paid[9]).toBe('En attente');
  expect(paid[11]).toBe('En attente');
});
it('counts refunds once and keeps gateway fees distinct from the Liberté net', async () => {
  const value = {
    ...report,
    payments: [payment({ status: 'RECONCILED', stripeFeeCents: 70, refundedCents: 1000, organizationNetCents: 1850 })],
    entries: [
      {
        createdAt: new Date(),
        kind: 'REFUND',
        bookingId: 'r1',
        currency: 'EUR',
        amountCents: -1000,
        reference: 're_1',
      },
    ],
  };
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(new Uint8Array(required(await new AccountingWorkbookAdapter().build(value))).buffer);
  const sheet = book.getWorksheet('Synthèse');
  expect(sheet?.getCell('B8').result).toBe(30);
  expect(sheet?.getCell('B11').result).toBe(10);
  expect(sheet?.getCell('B12').result).toBe(18.5);
});
it('stores untrusted spreadsheet text as text rather than executable formulas', async () => {
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(
    new Uint8Array(
      required(
        await new AccountingWorkbookAdapter().build({
          ...report,
          organizationName: '=HYPERLINK("https://example.com")',
        }),
      ),
    ).buffer,
  );
  expect(book.getWorksheet('Synthèse')?.getCell('A1').type).toBe(ExcelJS.ValueType.String);
});
