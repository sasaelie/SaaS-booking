import { drizzle } from 'drizzle-orm/node-postgres';
import { browserDatabase, browserSpace } from './portal-fixtures';
import { DrizzleActivityRepository } from '../../src/adapters/db/drizzle-activity.repository';
import { DrizzleSessionRepository } from '../../src/adapters/db/drizzle-session.repository';
import { generateDynamicTerms } from '../../src/core/domain/terms-generator';
import { parseBookingInput } from '../../src/core/domain/booking-validation';
import { signSelfCancelToken } from '../../src/core/domain/self-service-token';
import { sha256 } from '../../src/lib/sha256';
import { required } from '../../src/adapters/db/transaction';
export async function bankSpace() {
  const space = await browserSpace();
  const pool = browserDatabase();
  await pool.query("UPDATE activities SET payment_mode='BANK_TRANSFER' WHERE organization_id=$1", [
    space.organizationId,
  ]);
  await pool.query(
    "UPDATE organizations SET bank_iban='BE68539007547034',bank_account_name='Ateliers du quartier' WHERE id=$1",
    [space.organizationId],
  );
  const db = drizzle(pool);
  const activity = required(
    await new DrizzleActivityRepository(db).getActivityWithScheduleConfig(
      space.organizationId,
      space.activityId,
    ),
  );
  const terms = required(await generateDynamicTerms({ ...activity, activityName: activity.name }));
  const input = required(
    parseBookingInput({
      organizationId: space.organizationId,
      activityId: space.activityId,
      startsAtIso: space.date.toISOString(),
      idempotencyKey: crypto.randomUUID(),
      firstName: 'Alex',
      lastName: 'Test',
      email: 'alex@example.com',
      phone: null,
      acceptedTerms: true,
      acceptedAgeAttestation: true,
      acceptedTermsVersionHash: terms.versionHash,
    }),
  );
  const requestHash = required(await sha256(JSON.stringify(input)));
  const booking = required(
    await new DrizzleSessionRepository(db).reserveSeatAtomically({ input, requestHash }),
  );
  const token = await manageToken(space.organizationId, booking.bookingId);
  return { ...space, token, bookingId: booking.bookingId };
}

async function manageToken(organizationId: string, bookingId: string) {
  return required(
    await signSelfCancelToken(
      {
        organizationId,
        bookingId,
        version: 0,
        expUnixSeconds: Math.floor(Date.now() / 1000) + 3600,
      },
      'local_self_test_only_not_for_production_123456',
    ),
  );
}
