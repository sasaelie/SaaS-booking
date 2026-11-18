import { sql } from 'drizzle-orm';
import type {
  PlatformBillingRepositoryPort,
  PlatformInvoicePdfPort,
} from '../../core/ports/platform-billing';
import type { PortalActor } from '../../core/ports/portal-models';
import type {
  PlatformBillingSettings,
  IssuePlatformDocument,
  PlatformDocumentSourceInput,
} from '../../core/validation/platform-billing';
import type { PlatformReportInput } from '../../core/validation/platform-reporting';
import type { DrizzlePgDb } from './client';
import { atomic, rows } from './transaction';
import { requireOperator } from './portal/authorization';
import { platformDocumentSource } from './portal/platform-document-source';
import { issuePlatformDocument } from './portal/platform-document-issue';
import { platformDocuments } from './portal/platform-documents';
import { ok } from '../../lib/result';
import { failure } from '../../lib/errors';
import { ERROR_CODES } from '../../config/constants';
export class DrizzlePlatformBillingRepository implements PlatformBillingRepositoryPort {
  constructor(
    private readonly db: DrizzlePgDb,
    private readonly pdf: PlatformInvoicePdfPort,
  ) {}
  settings(actor: PortalActor) {
    return atomic(this.db, 'PlatformBilling', async (tx) => {
      await requireOperator(tx, actor);
      const [row] = await rows<{ profile: PlatformBillingSettings }>(
        tx,
        sql`SELECT profile FROM platform_billing_settings WHERE id=1`,
      );
      return ok(row?.profile ?? null);
    });
  }
  saveSettings(actor: PortalActor, input: PlatformBillingSettings) {
    return atomic(this.db, 'PlatformBilling', async (tx) => {
      await requireOperator(tx, actor);
      await tx.execute(
        sql`INSERT INTO platform_billing_settings(id,profile,updated_by) VALUES(1,${JSON.stringify(input)}::jsonb,${actor.id}) ON CONFLICT(id) DO UPDATE SET profile=EXCLUDED.profile,updated_by=EXCLUDED.updated_by,updated_at=now()`,
      );
      await tx.execute(
        sql`INSERT INTO platform_audit(actor_user_id,action) VALUES(${actor.id},'PLATFORM_BILLING_UPDATED')`,
      );
      return ok(undefined);
    });
  }
  source(actor: PortalActor, input: PlatformDocumentSourceInput) {
    return atomic(this.db, 'PlatformBilling', async (tx) => {
      await requireOperator(tx, actor);
      return platformDocumentSource(tx, input);
    });
  }
  documents(actor: PortalActor, input: PlatformReportInput) {
    return atomic(this.db, 'PlatformBilling', async (tx) => {
      await requireOperator(tx, actor);
      return ok(await platformDocuments(tx, input));
    });
  }
  issue(actor: PortalActor, input: IssuePlatformDocument) {
    return atomic(this.db, 'PlatformBilling', async (tx) => {
      await requireOperator(tx, actor);
      return issuePlatformDocument(tx, actor, input, this.pdf);
    });
  }
  download(actor: PortalActor, id: string) {
    return atomic(this.db, 'PlatformBilling', async (tx) => {
      await requireOperator(tx, actor);
      const [row] = await rows<{ pdf: Uint8Array; number: string }>(
        tx,
        sql`SELECT pdf,document_number AS number FROM platform_documents WHERE id=${id}::uuid`,
      );
      return row
        ? ok({ bytes: new Uint8Array(row.pdf), filename: `${row.number}.pdf` })
        : failure(ERROR_CODES.NOT_FOUND, 'PlatformBilling', 'document');
    });
  }
  subscriptionSource(actor: PortalActor, id: string) {
    return atomic(this.db, 'PlatformBilling', async (tx) => {
      await requireOperator(tx, actor);
      const [row] = await rows<{ invoiceId: string; customerId: string }>(
        tx,
        sql`SELECT e.reference AS "invoiceId",a.stripe_customer_id AS "customerId" FROM financial_entries e JOIN organization_access a ON a.organization_id=e.organization_id WHERE e.id=${id}::uuid AND e.kind='SUBSCRIPTION' AND e.amount_cents>0 AND e.reference LIKE 'in_%' AND a.stripe_customer_id IS NOT NULL`,
      );
      return row ? ok(row) : failure(ERROR_CODES.NOT_FOUND, 'PlatformBilling', 'subscription');
    });
  }
}
