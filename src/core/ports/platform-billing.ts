import type { Result } from '../../lib/result';
import type { PortalActor } from './portal-models';
import type { PlatformReportInput } from '../validation/platform-reporting';
import type {
  PlatformBillingSettings,
  BillingRecipient,
  IssuePlatformDocument,
  PlatformDocumentSourceInput,
} from '../validation/platform-billing';
export type InvoiceAmounts = { grossCents: number; netCents: number; taxCents: number };
export type PlatformDocumentSnapshot = InvoiceAmounts & {
  documentYear: number;
  sequence: number;
  id: string;
  number: string;
  kind: 'INVOICE' | 'CREDIT';
  organizationId: string;
  organizationName: string;
  sourceId: string;
  sourceReference: string | null;
  sourceOccurredAt: string;
  issuedAt: string;
  originalDocumentId: string | null;
  originalNumber: string | null;
  issuer: PlatformBillingSettings;
  recipient: BillingRecipient;
  taxRateBps: number;
  taxNote: string;
};
export type PlatformBillableSource = {
  paymentId: string;
  id: string;
  kind: 'INVOICE' | 'CREDIT';
  organizationId: string;
  organizationName: string;
  ownerEmail: string | null;
  amountCents: number;
  reference: string | null;
  occurredAt: Date;
  original: PlatformDocumentSnapshot | null;
  existingDocumentId: string | null;
};
export type PlatformDocumentListRow = {
  id: string;
  kind: 'INVOICE' | 'CREDIT' | 'PROVIDER';
  number: string;
  organizationName: string;
  amountCents: number;
  issuedAt: Date;
};
export type PlatformDocumentsPage = {
  entries: readonly PlatformDocumentListRow[];
  total: number;
  page: number;
};
export interface PlatformInvoicePdfPort {
  build(snapshot: PlatformDocumentSnapshot): Promise<Result<Uint8Array>>;
}
export interface PlatformInvoiceProviderPort {
  original(invoiceId: string, customerId: string): Promise<Result<string>>;
}
export interface PlatformBillingRepositoryPort {
  settings(actor: PortalActor): Promise<Result<PlatformBillingSettings | null>>;
  saveSettings(actor: PortalActor, input: PlatformBillingSettings): Promise<Result<void>>;
  source(
    actor: PortalActor,
    input: PlatformDocumentSourceInput,
  ): Promise<Result<PlatformBillableSource>>;
  documents(actor: PortalActor, input: PlatformReportInput): Promise<Result<PlatformDocumentsPage>>;
  issue(actor: PortalActor, input: IssuePlatformDocument): Promise<Result<{ id: string }>>;
  download(
    actor: PortalActor,
    id: string,
  ): Promise<Result<{ bytes: Uint8Array; filename: string }>>;
  subscriptionSource(
    actor: PortalActor,
    id: string,
  ): Promise<Result<{ invoiceId: string; customerId: string }>>;
}
