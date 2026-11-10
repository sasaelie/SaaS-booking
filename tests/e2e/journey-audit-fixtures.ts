import { drizzle } from 'drizzle-orm/node-postgres';
import { bankSpace } from './bank-fixtures';
import { browserDatabase, type browserSpace } from './portal-fixtures';
import { DrizzleActivityRepository } from '../../src/adapters/db/drizzle-activity.repository';
import { DrizzleSessionRepository } from '../../src/adapters/db/drizzle-session.repository';
import { DrizzleVoucherRepository } from '../../src/adapters/db/drizzle-voucher.repository';
import { generateDynamicTerms } from '../../src/core/domain/terms-generator';
import { parseBookingInput } from '../../src/core/domain/booking-validation';
import { required } from '../../src/adapters/db/transaction';
import { sha256 } from '../../src/lib/sha256';
export async function releasedCreditSpace() {
  const space = await bankSpace(),
    pool = browserDatabase();
  await pool.query(
    "UPDATE bookings SET status='CANCELLED_BY_ATTENDEE',amount_paid_cents=2500,confirmed_at=now(),paid_at=now(),locked_until=null WHERE id=$1",
    [space.bookingId],
  );
  const code = `RPT-${crypto.randomUUID()}`.toUpperCase();
  await pool.query(
    "INSERT INTO reschedule_vouchers(organization_id,origin_activity_id,origin_booking_id,code,initial_value_cents,currency,expires_at) VALUES($1,$2,$3,$4,2500,'EUR',now()+interval '2 months')",
    [space.organizationId, space.activityId, space.bookingId, code],
  );
  await pool.query('UPDATE activities SET price_cents=3500 WHERE id=$1', [space.activityId]);
  const booking = await reserveAuditSeat(space, code);
  required(
    await new DrizzleVoucherRepository(drizzle(pool)).cancelBookingAtomically({
      organizationId: space.organizationId,
      bookingId: booking.bookingId,
      version: 0,
      adminOverride: false,
      code: 'RPT-UNUSED-TEST',
      now: new Date(),
    }),
  );
  return { ...space, unpaidBookingId: booking.bookingId };
}
export async function reserveAuditSeat(
  space: Awaited<ReturnType<typeof browserSpace>>,
  voucherCode?: string,
) {
  const db = drizzle(browserDatabase());
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
      firstName: 'Robin',
      lastName: 'Credit',
      email: 'robin@example.com',
      acceptedTerms: true,
      acceptedAgeAttestation: true,
      acceptedTermsVersionHash: terms.versionHash,
      voucherCode,
    }),
  );
  return required(
    await new DrizzleSessionRepository(db).reserveSeatAtomically({
      input,
      requestHash: required(await sha256(JSON.stringify(input))),
    }),
  );
}
