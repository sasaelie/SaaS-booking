import { expect, it } from 'vitest';
import { eq, sql } from 'drizzle-orm';
import { db } from './database';
import { fixture, rawInput, reserve } from './fixtures';
import { portalFixture } from './portal-fixtures';
import { bookings, timeSlots, sessions } from '../../src/adapters/db/schema';
import { required } from '../../src/adapters/db/transaction';
import { OrganizationsUseCase } from '../../src/core/use-cases/portal/organizations.use-case';
import { ok } from '../../src/lib/result';
async function dashboardFixture() {
  const owner = await portalFixture();
  const c = await fixture('BANK_TRANSFER');
  await db.execute(
    sql`INSERT INTO organization_members(organization_id,user_id,role) VALUES(${c.organizationId},${owner.actor.id},'OWNER')`,
  );
  await db.update(timeSlots).set({ capacity: 50 }).where(eq(timeSlots.organizationId, c.organizationId));
  const rows = [];
  for (let i = 0; i < 8; i++) rows.push(required(await reserve(rawInput(c))));
  return { ...owner, c, rows };
}
it('counts only upcoming occupied reservations and opens exactly the matching active/proof/refund lists', async () => {
  const { actor, repository, c } = await populatedDashboardFixture();
  const data = required(await repository.overview(actor, c.organizationId));
  expect(data.bookingCount).toBe(3);
  expect(data.historicalBookingCount).toBe(8);
  expect(data.inactiveBookingCount).toBe(4);
  expect(data.pendingProofCount).toBe(1);
  expect(data.pendingRefundCount).toBe(1);
  for (const [status, count] of [
    ['UPCOMING', 3],
    ['PROOF_SUBMITTED', 1],
    ['REFUND_PENDING', 1],
  ] as const) {
    const list = required(await repository.bookings(actor, c.organizationId, { page: 1, search: '', status }));
    expect(list.total).toBe(count);
    expect(list.bookings).toHaveLength(count);
  }
});
it('reduces the current counter on cancellation while keeping the clearly labeled history', async () => {
  const { actor, repository, c, rows } = await dashboardFixture();
  const before = required(await repository.overview(actor, c.organizationId));
  await db
    .update(bookings)
    .set({ status: 'CANCELLED_BY_ATTENDEE', lockedUntil: null })
    .where(eq(bookings.id, rows[0]?.bookingId ?? ''));
  const after = required(await repository.overview(actor, c.organizationId));
  expect(after.bookingCount).toBe(before.bookingCount - 1);
  expect(after.historicalBookingCount).toBe(before.historicalBookingCount);
});
it('persists and normalizes contact numbers through validation, preserves omitted contact settings, and rejects outsiders', async () => {
  const owner = await portalFixture();
  const other = await portalFixture();
  const usecase = new OrganizationsUseCase({ current: async () => ok(owner.actor) }, owner.repository);
  const settings = {
    organizationId: owner.organizationId,
    name: 'Association de test',
    theme: 'SAGE',
    bankIban: null,
    bankAccountName: null,
    autoDeleteBankProof: true,
  };
  required(await usecase.settings({ ...settings, socialLinks: { phone: '0470 12 34 56' } }));
  expect(required(await owner.repository.getOrganization(owner.actor, owner.organizationId)).socialLinks?.phone).toBe(
    '+32470123456',
  );
  required(await usecase.settings({ ...settings, socialLinks: { instagram: 'https://instagram.com/example' } }));
  expect(required(await owner.repository.getOrganization(owner.actor, owner.organizationId)).socialLinks?.phone).toBe(
    '+32470123456',
  );
  expect((await usecase.settings({ ...settings, socialLinks: { phone: 'nonsense' } })).ok).toBe(false);
  expect(
    (
      await new OrganizationsUseCase({ current: async () => ok(other.actor) }, other.repository).settings({
        ...settings,
        socialLinks: { phone: '0470123456' },
      })
    ).ok,
  ).toBe(false);
  required(await usecase.settings({ ...settings, socialLinks: { phone: '' } }));
  expect(required(await owner.repository.getOrganization(owner.actor, owner.organizationId)).socialLinks?.phone).toBe(
    '',
  );
});

async function populatedDashboardFixture() {
  const input = await dashboardFixture();
  const { c, rows } = input;
  const ids = rows.map((r) => r.bookingId);
  await db
    .update(bookings)
    .set({ status: 'CONFIRMED', lockedUntil: null })
    .where(eq(bookings.id, ids[0] ?? ''));
  await db
    .update(bookings)
    .set({ status: 'CANCELLED_BY_ATTENDEE', lockedUntil: null, refundStatus: 'MANUAL_PENDING' })
    .where(eq(bookings.id, ids[1] ?? ''));
  await db
    .update(bookings)
    .set({ lockedUntil: new Date(Date.now() - 1000) })
    .where(eq(bookings.id, ids[2] ?? ''));
  await db
    .update(bookings)
    .set({ status: 'PROOF_SUBMITTED' })
    .where(eq(bookings.id, ids[4] ?? ''));
  await db
    .update(bookings)
    .set({ status: 'PROOF_SUBMITTED', lockedUntil: new Date(Date.now() - 1000) })
    .where(eq(bookings.id, ids[5] ?? ''));
  await db
    .update(bookings)
    .set({ status: 'EXPIRED', lockedUntil: null })
    .where(eq(bookings.id, ids[6] ?? ''));
  await moveToPast(c, ids[7] ?? '');

  return input;
}

it('does not count registrations on a cancelled session as upcoming', async () => {
  const { actor, repository, c, rows } = await dashboardFixture();
  await db
    .update(sessions)
    .set({ isCancelled: true })
    .where(eq(sessions.id, rows[0]?.sessionId ?? ''));
  expect(required(await repository.overview(actor, c.organizationId)).bookingCount).toBe(0);
  expect(
    required(await repository.bookings(actor, c.organizationId, { page: 1, search: '', status: 'UPCOMING' })).total,
  ).toBe(0);
});

async function moveToPast(c: Awaited<ReturnType<typeof fixture>>, id: string) {
  const past = crypto.randomUUID();
  await db.insert(sessions).values({
    id: past,
    organizationId: c.organizationId,
    activityId: c.activityId,
    startsAt: new Date(Date.now() - 86400000),
    endsAt: new Date(Date.now() - 82800000),
    capacity: 50,
    isManual: true,
  });
  await db.update(bookings).set({ status: 'CONFIRMED', lockedUntil: null, sessionId: past }).where(eq(bookings.id, id));
}
