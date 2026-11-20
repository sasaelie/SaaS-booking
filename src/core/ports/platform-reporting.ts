import type { Result } from '../../lib/result';
import type { PortalActor } from './portal-models';
import type { PlatformReportInput } from '../validation/platform-reporting';
export type PlatformLedgerRow = {
  documentId?: string | null;
  documentNumber?: string | null;
  invoiceNetCents?: number | null;
  invoiceTaxCents?: number | null;
  id: string;
  organizationId: string;
  organizationName: string;
  kind: string;
  scope: 'PLATFORM' | 'ORGANIZER' | 'CREDIT';
  amountCents: number;
  reference: string | null;
  occurredAt: Date;
};
export type PlatformReconciliationRow = {
  id: string;
  organizationId: string;
  organizationName: string;
  status: string;
  paidAt: Date;
  grossCents: number;
  commissionCents: number;
  feeCents: number | null;
  netCents: number | null;
  reference: string | null;
};
export type PlatformFinanceSummary = {
  subscriptionCents: number;
  commissionCents: number;
  feeCents: number;
  costCents: number;
  balanceCents: number;
  organizerCents: number;
};
export type PlatformFinanceReport = {
  filter: PlatformReportInput;
  summary: PlatformFinanceSummary;
  entries: readonly PlatformLedgerRow[];
  payments: readonly PlatformReconciliationRow[];
  total: number;
  page: number;
};
export type PlatformUsageReport = {
  filter: PlatformReportInput;
  organizerCount: number;
  organizationCount: number;
  activeOrganizationCount: number;
  confirmedCount: number;
  cancelledCount: number;
  participantCount: number;
  activityCount: number;
  publishedCount: number;
  daily: readonly { day: string; count: number }[];
  cohort: { registered: number; activity: number; booking: number };
  kinds: readonly { kind: string; count: number }[];
};
export interface PlatformReportingRepositoryPort {
  finance(
    actor: PortalActor,
    input: PlatformReportInput,
    exportAll?: boolean,
  ): Promise<Result<PlatformFinanceReport>>;
  usage(actor: PortalActor, input: PlatformReportInput): Promise<Result<PlatformUsageReport>>;
}
export interface PlatformExportPort {
  build(rows: readonly PlatformLedgerRow[], format: 'csv' | 'xlsx'): Promise<Result<Uint8Array>>;
}
