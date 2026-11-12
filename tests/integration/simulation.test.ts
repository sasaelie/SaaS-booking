import { afterAll, expect, it } from 'vitest';
import { eq, sql } from 'drizzle-orm';
import { db, pool } from './database';
import { fixture, rawInput, reserve } from './fixtures';
import { createDatabase } from '../../src/adapters/db/client';
import { syncSimulation } from '../../src/adapters/simulation/sync';
import { simulationServices } from '../../src/composition/simulation-services';
import { SimulationPaymentAdapter } from '../../src/adapters/simulation/payment.adapter';
import { SimulationRepository } from '../../src/adapters/simulation/repository';
import { bookings, outboxJobs, financialPayments } from '../../src/adapters/db/schema';
import { required } from '../../src/adapters/db/transaction';
import { verifySelfCancelToken } from '../../src/core/domain/self-service-token';
import { DrizzleVoucherQuoteRepository } from '../../src/adapters/db/drizzle-voucher-quote.repository';
import { QuoteVoucherUseCase } from '../../src/core/use-cases/quote-voucher.use-case';
const target = createDatabase(process.env['TEST_DATABASE_URL'] ?? '', 'public_simulation');
afterAll(() => target.pool.end());
async function setup(mode: 'STRIPE' | 'NONE' = 'STRIPE') {
  const c = await fixture(mode);
  required(await syncSimulation(pool, 'public', c.organizationId));
  const app = simulationServices(
    target.db,
    c.organizationId,
    'isolated-simulation-test-secret-minimum-32-characters',
    'http://localhost',
    new SimulationPaymentAdapter(),
  );
  const data = required(await app.bookingPage.execute({ slug: c.organizationId, activityId: c.activityId }));
  const input = { ...rawInput(c), acceptedTermsVersionHash: data.terms.versionHash };
  const b = required(await app.createBooking.execute(input));
  const repo = new SimulationRepository(
    target.db,
    c.organizationId,
    'isolated-simulation-test-secret-minimum-32-characters',
  );
  return { c, app, b, repo };
}
it('persists realistic test bookings and payments without touching live capacity, finance or jobs', async () => {
  const { c, b, repo } = await setup();
  expect(b.status).toBe('PENDING_PAYMENT');
  expect(required(await repo.list())[0]?.timezone).toBe('UTC');
  required(await repo.payment(b.bookingId, false));
  expect(required(await repo.list())[0]?.failure).toBe(true);
  for (const result of await Promise.all([repo.payment(b.bookingId, true), repo.payment(b.bookingId, true)]))
    required(result);
  expect(required(await repo.list())[0]?.status).toBe('CONFIRMED');
  expect(await db.select().from(bookings)).toHaveLength(0);
  expect(await db.select().from(financialPayments)).toHaveLength(0);
  expect(await db.select().from(outboxJobs)).toHaveLength(0);
  const real = required(await reserve(rawInput(c)));
  expect(real.availabilityAfterBooking.displayLabel).toBe('4 / 5');
  const testJobs = await target.db.select().from(outboxJobs).where(eq(outboxJobs.organizationId, c.organizationId));
  expect(testJobs.filter((j) => j.type === 'CONFIRMATION')).toHaveLength(1);
});
it('rejects cross-organization operations and test tokens signed against the live secret', async () => {
  const { c, b, repo } = await setup();
  const other = await fixture();
  const outsider = new SimulationRepository(
    target.db,
    other.organizationId,
    'isolated-simulation-test-secret-minimum-32-characters',
  );
  expect((await outsider.payment(b.bookingId, true)).ok).toBe(false);
  expect((await outsider.delete(b.bookingId)).ok).toBe(false);
  expect(required(await outsider.list())).toHaveLength(0);
  const row = required(await repo.list())[0];
  expect(row).toBeDefined();
  expect((await verifySelfCancelToken(row?.managementToken ?? '', 'real-test-secret', new Date())).ok).toBe(false);
  expect(
    (
      await simulationServices(
        target.db,
        other.organizationId,
        'isolated-simulation-test-secret-minimum-32-characters',
        'http://localhost',
        new SimulationPaymentAdapter(),
      ).verify(row?.managementToken ?? '')
    ).ok,
  ).toBe(false);
  expect(
    (await db.execute(sql`SELECT count(*)::int AS n FROM bookings WHERE organization_id=${c.organizationId}`))
      .rows[0]?.['n'],
  ).toBe(0);
});
it('uses the same cancellation/voucher engine but never accepts its codes in live storage or another organization', async () => {
  const { c, b, repo, app } = await setup();
  required(await repo.payment(b.bookingId, true));
  const token = required(await repo.list())[0]?.managementToken ?? '';
  const cancelled = required(await app.cancellation.cancelByAttendee({ token }));
  expect(cancelled).toBeDefined();
  const rows = await target.db.execute<{ code: string }>(
    sql`SELECT code FROM reschedule_vouchers WHERE origin_booking_id=${b.bookingId}`,
  );
  const code = rows.rows[0]?.code ?? '';
  expect(code).not.toBe('');
  const quote = new QuoteVoucherUseCase(new DrizzleVoucherQuoteRepository(db));
  expect((await quote.execute({ organizationId: c.organizationId, activityId: c.activityId, code })).ok).toBe(false);
  const other = await fixture();
  expect(
    (await app.quote.execute({ organizationId: other.organizationId, activityId: other.activityId, code })).ok,
  ).toBe(false);
});
it('removes a test from the list, releases its own seat, anonymizes contacts and invalidates management', async () => {
  const { b, repo, app } = await setup();
  const token = required(await repo.list())[0]?.managementToken ?? '';
  required(await repo.delete(b.bookingId));
  expect(required(await repo.list())).toHaveLength(0);
  expect((await repo.visible(b.bookingId)).ok).toBe(false);
  expect((await app.selfBooking.execute(token)).ok).toBe(false);
  const [row] = await target.db.select().from(bookings).where(eq(bookings.id, b.bookingId));
  expect(row?.email).toBe('deleted@example.invalid');
  expect(row?.status).toBe('CANCELLED_BY_ATTENDEE');
});
it('refreshes configuration even when a real reservation materializes the same recurring session later', async () => {
  const { c } = await setup();
  required(await reserve(rawInput(c)));
  expect((await syncSimulation(pool, 'public', c.organizationId)).ok).toBe(true);
});
it('never falls back to live public tables if a simulation table is missing', async () => {
  const isolated = createDatabase(process.env['TEST_DATABASE_URL'] ?? '', 'absent_simulation');
  try {
    await expect(isolated.pool.query('SELECT * FROM bookings')).rejects.toThrow();
  } finally {
    await isolated.pool.end();
  }
});

it('keeps every simulation foreign key inside its private namespace, with RLS and no cloned credentials', async () => {
  const references = await pool.query(
    `SELECT DISTINCT n.nspname AS target FROM pg_constraint c JOIN pg_namespace s ON s.oid=c.connamespace JOIN pg_class t ON t.oid=c.confrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE s.nspname='public_simulation' AND c.contype='f'`,
  );
  expect(references.rows).toEqual([{ target: 'public_simulation' }]);
  expect(
    (await pool.query("SELECT to_regclass('public_simulation.account') AS credentials")).rows[0]?.credentials,
  ).toBeNull();
  expect(
    (
      await pool.query(
        "SELECT count(*)::int AS n FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public_simulation' AND c.relkind='r' AND NOT c.relrowsecurity",
      )
    ).rows[0]?.n,
  ).toBe(0);
});
