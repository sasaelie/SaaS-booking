import { drizzle } from 'drizzle-orm/node-postgres';
import { bankSpace } from './bank-fixtures';
import { browserSpace, browserDatabase } from './portal-fixtures';
import { reserveAuditSeat } from './journey-audit-fixtures';
import { DrizzlePortalRepository } from '../../src/adapters/db/drizzle-portal.repository';
import { required } from '../../src/adapters/db/transaction';
import { bookings, sessions } from '../../src/adapters/db/schema';
import { eq } from 'drizzle-orm';
import { SAAS } from '../../src/config/constants';
export async function twoSessionSpace() {
  const space = await bankSpace();
  const date = new Date(space.date.getTime() + 7 * 86400000);
  required(
    await new DrizzlePortalRepository(drizzle(browserDatabase())).addSession(space.actor, {
      organizationId: space.organizationId,
      activityId: space.activityId,
      startsAt: date,
      endsAt: new Date(date.getTime() + 7200000),
      capacity: 8,
    }),
  );
  const next = await reserveAuditSeat({ ...space, date });
  await browserDatabase().query(
    "UPDATE bookings SET first_name='Other',last_name='Session' WHERE id=$1",
    [next.bookingId],
  );
  await browserDatabase().query(
    "UPDATE activities SET address='Rue du Test 12',practical_info='Apporter un tablier' WHERE id=$1",
    [space.activityId],
  );
  return space;
}
export async function emptyWeeklySpace() {
  const space = await browserSpace();
  const time = new Intl.DateTimeFormat('fr-BE', {
    timeZone: 'Europe/Brussels',
    hour: '2-digit',
    minute: '2-digit',
  });
  await browserDatabase().query('DELETE FROM sessions WHERE activity_id=$1', [space.activityId]);
  await browserDatabase().query(
    'INSERT INTO time_slots(organization_id,activity_id,day_of_week,start_time_local,end_time_local,capacity) VALUES($1,$2,$3,$4,$5,8)',
    [
      space.organizationId,
      space.activityId,
      space.date.getUTCDay(),
      time.format(space.date),
      time.format(new Date(space.date.getTime() + 7200000)),
    ],
  );
  return space;
}

export async function paginatedSessionSpace() {
  const space = await bankSpace();
  const db = drizzle(browserDatabase());
  const [original] = await db.select().from(bookings).where(eq(bookings.id, space.bookingId));
  if (!original) throw Error('Missing booking');
  await db.update(sessions).set({ capacity: 100 }).where(eq(sessions.id, original.sessionId));
  await db.insert(bookings).values(
    Array.from({ length: SAAS.PAGE_SIZE }, (_, index) => ({
      ...original,
      paymentReference: null,
      checkoutReference: null,
      id: crypto.randomUUID(),
      idempotencyKey: crypto.randomUUID(),
      email: `page-${index}@example.com`,
    })),
  );
  return space;
}
