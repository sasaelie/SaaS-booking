import type { PortalIdentityPort } from '../../ports/portal-identity.port';
import type {
  PlatformReportingRepositoryPort,
  PlatformExportPort,
} from '../../ports/platform-reporting';
import { parsePlatformReport } from '../../domain/platform-reporting';
import { withPortalActor } from './actor';
import { failure } from '../../../lib/errors';
import { ERROR_CODES } from '../../../config/constants';
import { PLATFORM_REPORTING } from '../../../config/platform-reporting';
export class PlatformReportingUseCase {
  constructor(
    private readonly identity: PortalIdentityPort,
    private readonly repository: PlatformReportingRepositoryPort,
    private readonly exporter: PlatformExportPort,
  ) {}
  finance(raw: unknown) {
    return withPortalActor(this.identity, 'PlatformFinance', (actor) => {
      const input = parsePlatformReport(raw);
      return input.ok ? this.repository.finance(actor, input.value) : Promise.resolve(input);
    });
  }
  usage(raw: unknown) {
    return withPortalActor(this.identity, 'PlatformUsage', (actor) => {
      const input = parsePlatformReport(raw);
      return input.ok ? this.repository.usage(actor, input.value) : Promise.resolve(input);
    });
  }
  export(raw: unknown, format: 'csv' | 'xlsx') {
    return withPortalActor(this.identity, 'PlatformExport', async (actor) => {
      const input = parsePlatformReport(raw);
      if (!input.ok) return input;
      const report = await this.repository.finance(
        actor,
        { ...input.value, view: 'journal' },
        true,
      );
      if (!report.ok) return report;
      if (report.value.total > PLATFORM_REPORTING.EXPORT_MAX)
        return failure(ERROR_CODES.VALIDATION_FAILED, 'PlatformExport', 'too-large');
      return this.exporter.build(report.value.entries, format);
    });
  }
}
