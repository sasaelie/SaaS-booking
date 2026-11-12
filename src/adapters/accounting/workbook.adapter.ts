import type { AccountingWorkbookPort, AccountingReport } from '../../core/ports/accounting.port';
import { guardUseCase } from '../../lib/guard-use-case';
import { ok } from '../../lib/result';
import { detailSheets } from './sheets';
import { summarySheet } from './summary';
export class AccountingWorkbookAdapter implements AccountingWorkbookPort {
  build(report: AccountingReport) {
    return guardUseCase('Accounting', 'workbook', async () => {
      const { default: ExcelJS } = await import('exceljs');
      const book = new ExcelJS.Workbook();
      book.creator = report.organizationName;
      book.created = report.generatedAt;
      book.calcProperties.fullCalcOnLoad = true;
      summarySheet(book, report);
      detailSheets(book, report);
      return ok(new Uint8Array(await book.xlsx.writeBuffer()));
    });
  }
}
