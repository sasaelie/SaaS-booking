import type {
  PlatformReportingRepositoryPort,
  PlatformFinanceReport,
} from '../../core/ports/platform-reporting';
import type { PlatformReportInput } from '../../core/validation/platform-reporting';
import type { PortalActor } from '../../core/ports/portal-models';
import type { DrizzlePgDb } from './client';
import { atomic } from './transaction';
import { requireOperator } from './portal/authorization';
import {
  financeSummary,
  ledgerEntries,
  reconciliationEntries,
} from './portal/platform-report-finance';
import { platformUsage } from './portal/platform-report-usage';
import { ok } from '../../lib/result';
export class DrizzlePlatformReportingRepository implements PlatformReportingRepositoryPort {
  constructor(private readonly db: DrizzlePgDb) {}
  finance(actor: PortalActor, input: PlatformReportInput, exportAll = false) {
    return atomic<PlatformFinanceReport>(this.db, 'PlatformReporting', async (tx) => {
      await requireOperator(tx, actor);
      const summary = await financeSummary(tx, input);
      const page = Math.min(input.page, Math.max(1, Math.ceil(summary.total / input.pageSize)));
      if (input.view === 'rapprochements') {
        const payments = await reconciliationEntries(tx, input);
        return ok({
          filter: input,
          summary,
          entries: [],
          payments: payments.entries,
          total: payments.total,
          page: payments.page,
        });
      }
      const entries = await ledgerEntries(tx, input, page, exportAll);
      return ok({ filter: input, summary, entries, payments: [], total: summary.total, page });
    });
  }
  usage(actor: PortalActor, input: PlatformReportInput) {
    return atomic(this.db, 'PlatformUsage', async (tx) => {
      await requireOperator(tx, actor);
      return ok(await platformUsage(tx, input));
    });
  }
}
