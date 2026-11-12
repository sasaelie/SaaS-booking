import type { AccountingWorkbookPort } from '../../ports/accounting.port';
import { z } from 'zod';
import type { PortalIdentityPort } from '../../ports/portal-identity.port';
import type { FinancialRepositoryPort } from '../../ports/financial.port';
import { LibertySelectionSchema } from '../../validation/commercial';
import { PlatformCostSchema } from '../../validation/commercial';
import { withPortalActor } from './actor';
import { failure } from '../../../lib/errors';
import { ERROR_CODES } from '../../../config/constants';
export class FinancialUseCase {
  recordCost(raw: unknown) {
    return withPortalActor(this.identity, 'PlatformCost', async (actor) => {
      const parsed = PlatformCostSchema.safeParse(raw);
      return parsed.success
        ? this.repository.recordCost(actor, parsed.data)
        : failure(ERROR_CODES.VALIDATION_FAILED, 'PlatformCost', 'input');
    });
  }
  constructor(
    private readonly identity: PortalIdentityPort,
    private readonly repository: FinancialRepositoryPort,
    private readonly spreadsheet?: AccountingWorkbookPort,
  ) {}
  summary(raw: unknown) {
    return withPortalActor(this.identity, 'Financial', async (actor) => {
      const id = z.uuid().safeParse(raw);
      return id.success
        ? this.repository.summary(actor, id.data)
        : failure(ERROR_CODES.VALIDATION_FAILED, 'Financial', 'summary');
    });
  }
  workbook(raw: unknown) {
    return withPortalActor(this.identity, 'AccountingWorkbook', async (actor) => {
      const id = z.uuid().safeParse(raw);
      if (!id.success || !this.spreadsheet) return failure(ERROR_CODES.VALIDATION_FAILED, 'Accounting', 'input');
      const report = await this.repository.report(actor, id.data);
      return report.ok ? this.spreadsheet.build(report.value) : report;
    });
  }
  export(raw: unknown) {
    return withPortalActor(this.identity, 'Financial', async (actor) => {
      const id = z.uuid().safeParse(raw);
      return id.success
        ? this.repository.export(actor, id.data)
        : failure(ERROR_CODES.VALIDATION_FAILED, 'Financial', 'export');
    });
  }
  selectActivities(raw: unknown) {
    return withPortalActor(this.identity, 'Commercial', async (actor) => {
      const input = LibertySelectionSchema.safeParse(raw);
      return input.success
        ? this.repository.selectActivities(actor, input.data.organizationId, input.data.activityIds)
        : failure(ERROR_CODES.VALIDATION_FAILED, 'Commercial', 'selection');
    });
  }
}
