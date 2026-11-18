import ExcelJS from 'exceljs';
import type { PlatformExportPort, PlatformLedgerRow } from '../../core/ports/platform-reporting';
import { PLATFORM_REPORTING as UI } from '../../config/platform-reporting';
import { ok } from '../../lib/result';
import { guardUseCase } from '../../lib/guard-use-case';
const headers = [
  'Date',
  'Organisation',
  'Périmètre',
  'Mouvement',
  'Montant en centimes',
  'Devise',
  'Référence',
  'Identifiant',
  'Facture plateforme',
  'Montant HT en centimes',
  'TVA en centimes',
];
export class PlatformExportAdapter implements PlatformExportPort {
  build(rows: readonly PlatformLedgerRow[], format: 'csv' | 'xlsx') {
    return guardUseCase('PlatformExport', 'build', async () => {
      const values = rows.map((row) => [
        row.occurredAt.toISOString(),
        row.organizationName,
        row.scope,
        UI.KINDS[row.kind] ?? row.kind,
        row.amountCents,
        'EUR',
        row.reference ?? '',
        row.id,
        row.documentNumber ?? '',
        row.invoiceNetCents ?? '',
        row.invoiceTaxCents ?? '',
      ]);
      if (format === 'csv')
        return ok(
          new TextEncoder().encode(
            '\uFEFF' + [headers, ...values].map((row) => row.map(cell).join(';')).join('\r\n'),
          ),
        );
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Journal');
      sheet.addRow(headers);
      sheet.addRows(values);
      sheet.views = [{ state: 'frozen', ySplit: 1 }];
      sheet.getRow(1).font = { bold: true };
      sheet.columns.forEach((column) => {
        column.width = 24;
      });
      workbook.addWorksheet('Informations').addRow([UI.EXPORT_NOTE]);
      return ok(new Uint8Array(await workbook.xlsx.writeBuffer()));
    });
  }
}
function cell(value: string | number) {
  const text =
    typeof value === 'string' && /^[\s]*[=+@\-\t\r]/.test(value) ? `'${value}` : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}
