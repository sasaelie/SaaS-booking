import { expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from './database';
import { financialFixture } from './financial-fixtures';
import { recurringActivity, portalFixture } from './portal-fixtures';
import { rawInput, reserve } from './fixtures';
import { issuedVoucher } from './lifecycle-fixtures';
import { organizationAccess } from '../../src/adapters/db/schema/saas';
import { activities, organizations, bookings } from '../../src/adapters/db/schema';
import { commercialState } from '../../src/adapters/db/commercial-access';
import { DrizzleActivityRepository } from '../../src/adapters/db/drizzle-activity.repository';
import { DrizzleBankRepository } from '../../src/adapters/db/drizzle-bank.repository';
import { generateDynamicTerms } from '../../src/core/domain/terms-generator';
import { required } from '../../src/adapters/db/transaction';
async function currentTerms(context: Awaited<ReturnType<typeof financialFixture>>) {
  const activity = required(
    await new DrizzleActivityRepository(db).getActivityWithScheduleConfig(
      context.organizationId,
      context.activityId,
    ),
  );
  return {
    ...context,
    terms: required(await generateDynamicTerms({ ...activity, activityName: activity.name })),
  };
}
it('keeps an engaged bank transfer after expiry and applies Liberty only to the next booking', async () => {
  const owner = await financialFixture();
  await db
    .update(organizationAccess)
    .set({ complimentary: true })
    .where(eq(organizationAccess.organizationId, owner.organizationId));
  await bankConfiguration(owner);
  const context = await currentTerms(owner);
  const input = rawInput(context);
  const bank = required(await reserve(input));
  const originalDeadline = bank.lockedUntil;
  await db
    .update(organizationAccess)
    .set({ complimentary: false, status: 'CANCELED', currentPeriodEnd: new Date() })
    .where(eq(organizationAccess.organizationId, owner.organizationId));
  const replay = required(await reserve(input));
  expect(replay.paymentMode).toBe('BANK_TRANSFER');
  expect(replay.lockedUntil).toEqual(originalDeadline);
  const next = required(await reserve(rawInput(await currentTerms(owner))));
  expect(next).toMatchObject({
    paymentMode: 'STRIPE',
    commissionCents: 150,
    chargeModel: 'DESTINATION',
  });
  await db
    .update(bookings)
    .set({ status: 'PROOF_SUBMITTED' })
    .where(eq(bookings.id, bank.bookingId));
  const decision = await new DrizzleBankRepository(db).finalizeAdminBankDecisionAtomically({
    organizationId: owner.organizationId,
    bookingId: bank.bookingId,
    decision: 'APPROVE',
    now: new Date(),
  });
  expect(decision.ok).toBe(true);
});
it('keeps a manual choice made before expiry and does not delete the other activities', async () => {
  const owner = await financialFixture();
  const end = new Date(Date.now() + 86400000);
  await db
    .update(organizationAccess)
    .set({ status: 'ACTIVE', currentPeriodEnd: end })
    .where(eq(organizationAccess.organizationId, owner.organizationId));
  const ids = [owner.activityId];
  for (let i = 0; i < 4; i++)
    ids.push(
      required(
        await owner.repository.createActivity(owner.actor, recurringActivity(owner.organizationId)),
      ).activityId,
    );
  const chosen = ids.slice(-2);
  required(await owner.financial.selectActivities(owner.actor, owner.organizationId, chosen));
  await db
    .update(organizationAccess)
    .set({ currentPeriodEnd: new Date(Date.now() - 1) })
    .where(eq(organizationAccess.organizationId, owner.organizationId));
  const state = await commercialState(db, owner.organizationId);
  expect(state.plan).toBe('LIBERTE');
  expect(state.selected).toEqual(chosen);
  expect(await db.select().from(activities)).toHaveLength(5);
  expect((await reserve(rawInput(owner))).ok).toBe(false);
});
it('prioritizes a suspension over a complimentary Pro access', async () => {
  const owner = await financialFixture();
  await db
    .update(organizationAccess)
    .set({ complimentary: true, suspendedAt: new Date() })
    .where(eq(organizationAccess.organizationId, owner.organizationId));
  expect((await reserve(rawInput(owner))).ok).toBe(false);
  expect((await owner.financial.export(owner.actor, owner.organizationId)).ok).toBe(false);
});
it('honors a fully credited booking after Pro expiry even without a ready payment gateway', async () => {
  const origin = await issuedVoucher();
  await db
    .update(organizationAccess)
    .set({ complimentary: false })
    .where(eq(organizationAccess.organizationId, origin.context.organizationId));
  await db
    .update(organizations)
    .set({ stripeReady: false, usesPlatformPayments: false })
    .where(eq(organizations.id, origin.context.organizationId));
  const result = required(
    await reserve({ ...rawInput(origin.context), voucherCode: origin.voucher.code }),
  );
  expect(result).toMatchObject({ status: 'CONFIRMED', amountToPayCents: 0, commissionCents: 0 });
});
it('selects existing activities when a complimentary Pro access is revoked after onboarding', async () => {
  const owner = await portalFixture(true);
  required(await owner.repository.grantAccess(owner.actor, owner.organizationId, true));
  const first = required(
    await owner.repository.createActivity(owner.actor, {
      ...recurringActivity(owner.organizationId),
      priceCents: 0,
    }),
  );
  required(await owner.repository.grantAccess(owner.actor, owner.organizationId, false));
  const state = await commercialState(db, owner.organizationId);
  expect(state.selected).toEqual([first.activityId]);
});

async function bankConfiguration(owner: Awaited<ReturnType<typeof financialFixture>>) {
  await db
    .update(organizations)
    .set({ bankIban: 'BE68539007547034', bankAccountName: 'Test ASBL' })
    .where(eq(organizations.id, owner.organizationId));
  await db
    .update(activities)
    .set({ paymentMode: 'BANK_TRANSFER' })
    .where(eq(activities.id, owner.activityId));
}
