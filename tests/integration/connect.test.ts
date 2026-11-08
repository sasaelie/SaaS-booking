import { expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { db } from './database';
import { portalFixture } from './portal-fixtures';
import { createConnectState, consumeConnectState } from '../../src/adapters/payments/connect-state';
import { required } from '../../src/adapters/db/transaction';
it('binds Stripe OAuth state to the owner, rejects replay, foreign accounts and expired state', async () => {
  const owner = await portalFixture();
  const other = await portalFixture();
  const token = required(await createConnectState(db, owner.actor, owner.organizationId));
  expect((await consumeConnectState(db, other.actor, token)).ok).toBe(false);
  expect(required(await consumeConnectState(db, owner.actor, token))).toBe(owner.organizationId);
  expect((await consumeConnectState(db, owner.actor, token)).ok).toBe(false);
  expect((await createConnectState(db, other.actor, owner.organizationId)).ok).toBe(false);
  const expired = required(await createConnectState(db, owner.actor, owner.organizationId));
  await db.execute(
    sql`UPDATE stripe_connect_states SET expires_at=clock_timestamp()-interval '1 second'`,
  );
  expect((await consumeConnectState(db, owner.actor, expired)).ok).toBe(false);
});
