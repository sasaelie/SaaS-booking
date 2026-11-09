import { expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from './database';
import { ownerOf } from './service-voucher-fixtures';
import { fixture, reserve, rawInput } from './fixtures';
import { required } from '../../src/adapters/db/transaction';
import { ok } from '../../src/lib/result';
import { OrganizationsUseCase } from '../../src/core/use-cases/portal/organizations.use-case';
import { DrizzlePublicCatalogRepository } from '../../src/adapters/db/drizzle-public-catalog.repository';
import { bookings } from '../../src/adapters/db/schema';
it('saves public social links for the owner while refusing foreign owners and unsafe links', async () => {
  const c = await fixture();
  const owner = await ownerOf(c.organizationId);
  const foreign = await fixture();
  const stranger = await ownerOf(foreign.organizationId);
  const input = {
    organizationId: c.organizationId,
    name: 'Atelier',
    bankIban: null,
    bankAccountName: null,
    theme: 'SAGE',
    autoDeleteBankProof: true,
    socialLinks: { instagram: 'https://instagram.com/test' },
  };
  const service = new OrganizationsUseCase(
    { current: async () => ok(owner.actor) },
    owner.repository,
  );
  expect((await service.settings(input)).ok).toBe(true);
  const catalog = required(await new DrizzlePublicCatalogRepository(db).find(c.organizationId));
  expect(catalog.socialLinks?.instagram).toBe('https://instagram.com/test');
  expect(
    (await service.settings({ ...input, socialLinks: { instagram: 'javascript:alert(1)' } })).ok,
  ).toBe(false);
  expect((await stranger.repository.updateSettings(stranger.actor, input)).ok).toBe(false);
});
it('keeps payment filters tenant scoped and distinguishes on-site reservations from payments received', async () => {
  const c = await fixture();
  const other = await fixture();
  const owner = await ownerOf(c.organizationId);
  const own = required(await reserve(rawInput(c)));
  const foreign = required(await reserve(rawInput(other)));
  await db
    .update(bookings)
    .set({ status: 'PENDING_PAYMENT', lockedUntil: new Date(Date.now() - 3600000) })
    .where(eq(bookings.id, foreign.bookingId));
  const base = { page: 1, search: '', status: 'PAYMENT_EXPIRED' };
  expect(required(await owner.repository.bookings(owner.actor, c.organizationId, base)).total).toBe(
    0,
  );
  expect(
    required(
      await owner.repository.bookings(owner.actor, c.organizationId, {
        ...base,
        status: 'PAYMENT_RECEIVED',
      }),
    ).total,
  ).toBe(0);
  expect(
    required(
      await owner.repository.bookings(owner.actor, c.organizationId, {
        ...base,
        status: 'PAYMENT_DUE',
      }),
    ).bookings[0]?.id,
  ).toBe(own.bookingId);
});
