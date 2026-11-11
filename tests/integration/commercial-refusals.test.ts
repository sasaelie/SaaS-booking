import { expect, it } from 'vitest';
import { eq, sql } from 'drizzle-orm';
import { db } from './database';
import { portalFixture } from './portal-fixtures';
import { issuedVoucher } from './lifecycle-fixtures';
import { DrizzleFinancialRepository } from '../../src/adapters/db/drizzle-financial.repository';
import { DrizzleVoucherRepository } from '../../src/adapters/db/drizzle-voucher.repository';
import { organizationAccess } from '../../src/adapters/db/schema/saas';
import { rescheduleVouchers } from '../../src/adapters/db/schema';
import { required } from '../../src/adapters/db/transaction';
it('refuses a foreign voucher without consuming it even when the target association has Pro', async () => {
  const origin = await issuedVoucher();
  const other = await portalFixture();
  await db
    .update(organizationAccess)
    .set({ complimentary: true })
    .where(eq(organizationAccess.organizationId, other.organizationId));
  const result = await new DrizzleVoucherRepository(db).redeemVoucherForExternalBenefitAtomically({
    organizationId: other.organizationId,
    code: origin.voucher.code,
    now: new Date(),
  });
  expect(result.ok).toBe(false);
  expect((await db.select().from(rescheduleVouchers))[0]?.status).toBe('ACTIVE');
});
it('requires an operator for exceptional costs and deduplicates real cost references', async () => {
  const owner = await portalFixture();
  const repository = new DrizzleFinancialRepository(db);
  const input = {
    organizationId: owner.organizationId,
    category: 'CONNECT' as const,
    amountCents: 200,
    sourceReference: 'stripe-cost:local',
    occurredAt: new Date().toISOString(),
  };
  expect((await repository.recordCost(owner.actor, input)).ok).toBe(false);
  const operator = await portalFixture(true);
  required(await repository.recordCost(operator.actor, input));
  required(await repository.recordCost(operator.actor, input));
  const overview = required(
    await operator.repository.platform(operator.actor, { search: '', page: 1 }),
  );
  expect(overview.financial?.otherCostsCents).toBe(200);
});
it('keeps accounting tables protected from anonymous/public Data API access', async () => {
  const result = await db.execute(sql`SELECT c.relname,c.relrowsecurity,
    EXISTS(SELECT 1 FROM aclexplode(COALESCE(c.relacl,acldefault('r',c.relowner))) a WHERE a.grantee=0) AS public_grant
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=current_schema()
    AND c.relname IN ('financial_payments','financial_entries','accounting_archives','platform_costs')`);
  expect(result.rows).toHaveLength(4);
  for (const row of result.rows)
    expect(row).toMatchObject({ relrowsecurity: true, public_grant: false });
});
