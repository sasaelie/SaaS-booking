import { describe, it, expect } from 'vitest';
import ExcelJS from 'exceljs';
import { PlatformExportAdapter } from '../../src/adapters/accounting/platform-export.adapter';
import type { PlatformLedgerRow } from '../../src/core/ports/platform-reporting';
const row: PlatformLedgerRow = {
  id: 'row',
  organizationId: 'example',
  organizationName: '=SUM(1;1)',
  kind: 'COMMISSION_REFUND',
  scope: 'PLATFORM',
  amountCents: -40,
  reference: '@unsafe',
  occurredAt: new Date('2026-11-17T12:00:00Z'),
  documentNumber: 'AVOIR-2026-000001',
  invoiceNetCents: -33,
  invoiceTaxCents: -7,
};
describe('platform accounting exports', () => {
  it('neutralizes text formulas while preserving numeric signs and document references in CSV', async () => {
    const result = await new PlatformExportAdapter().build([row], 'csv');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const text = new TextDecoder().decode(result.value);
    expect(text).toContain("'=SUM(1;1)");
    expect(text).toContain("'@unsafe");
    expect(text).toContain('"-40"');
    expect(text).toContain('"-33"');
    expect(text).toContain('"-7"');
    expect(text).toContain('AVOIR-2026-000001');
  });
  it('writes untrusted Excel text as strings, never formulas', async () => {
    const result = await new PlatformExportAdapter().build([row], 'xlsx');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(new Uint8Array(result.value).buffer);
    expect(workbook.getWorksheet('Journal')?.getCell('B2').type).toBe(ExcelJS.ValueType.String);
    expect(workbook.getWorksheet('Journal')?.getCell('E2').value).toBe(-40);
  });
});
