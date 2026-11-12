import { asc, eq } from 'drizzle-orm';
import { organizations, financialPayments, financialEntries } from './schema';
import type { Executor } from './transaction';
import type { AccountingReport } from '../../core/ports/accounting.port';
export async function accountingReport(db: Executor, id: string): Promise<AccountingReport> {
  const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
  if (!org) throw Error('Missing organization');
  const payments = await db
    .select()
    .from(financialPayments)
    .where(eq(financialPayments.organizationId, id))
    .orderBy(asc(financialPayments.createdAt));
  const entries = await db
    .select()
    .from(financialEntries)
    .where(eq(financialEntries.organizationId, id))
    .orderBy(asc(financialEntries.createdAt));
  return {
    organizationName: org.name,
    organizationSlug: org.slug,
    generatedAt: new Date(),
    payments,
    entries,
  };
}
