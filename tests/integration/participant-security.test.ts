import { expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { db } from './database';
import { confirmed } from './participant-fixtures';
import { portalFixture } from './portal-fixtures';
import { ParticipantRecoveryRepository } from '../../src/adapters/db/participant/recovery';
import { required, rows } from '../../src/adapters/db/transaction';
import { secret } from './participant-fixtures';
it('only recovers a participant code for an authorized member of its organization', async () => {
  const setup = await confirmed();
  const organizer = await portalFixture();
  const repository = new ParticipantRecoveryRepository(db, secret);
  expect(
    (
      await repository.recover(
        organizer.actor,
        setup.context.organizationId,
        setup.booking.bookingId,
      )
    ).ok,
  ).toBe(false);
  await db.execute(
    sql`INSERT INTO organization_members(organization_id,user_id,role) VALUES(${setup.context.organizationId},${organizer.actor.id},'OWNER')`,
  );
  expect(
    required(
      await repository.recover(
        organizer.actor,
        setup.context.organizationId,
        setup.booking.bookingId,
      ),
    ),
  ).toBe(setup.ticket.code);
  expect(
    (await repository.recover(organizer.actor, organizer.organizationId, setup.booking.bookingId))
      .ok,
  ).toBe(false);
});
it('keeps new access tables behind RLS and grants no table rights to PUBLIC', async () => {
  const result = await rows<{ relrowsecurity: boolean; public_read: boolean }>(
    db,
    sql`
    SELECT c.relrowsecurity,EXISTS(SELECT 1 FROM aclexplode(COALESCE(c.relacl,acldefault('r',c.relowner))) a
      WHERE a.grantee=0 AND a.privilege_type IN ('SELECT','INSERT','UPDATE','DELETE')) AS public_read
    FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname IN ('public','public_simulation') AND c.relname IN ('booking_access_credentials','participant_booking_sessions','booking_access_events')`,
  );
  expect(result).toHaveLength(6);
  expect(result.every((row) => row.relrowsecurity && !row.public_read)).toBe(true);
});
