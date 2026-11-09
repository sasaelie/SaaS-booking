import { eq } from 'drizzle-orm';
import { bookings, sessions, activities, organizations } from '../db/schema';
import type { DrizzlePgDb } from '../db/client';
import { TIME, DEFAULTS } from '../../config/constants';
import { SERVICE } from '../../config/service';
import { SERVICE_MAIL } from '../../config/service-mail';
import { formatMoney } from '../../lib/format-money';
export async function readBookingMail(db: DrizzlePgDb, bookingId: string) {
  const [row] = await db
    .select()
    .from(bookings)
    .innerJoin(sessions, eq(sessions.id, bookings.sessionId))
    .innerJoin(activities, eq(activities.id, bookings.activityId))
    .innerJoin(organizations, eq(organizations.id, bookings.organizationId))
    .where(eq(bookings.id, bookingId));
  return row;
}
export type BookingMailRow = NonNullable<Awaited<ReturnType<typeof readBookingMail>>>;
export function eventMailDetails(row: BookingMailRow, reminder: boolean, now = new Date()) {
  const { activities: activity, bookings: booking, sessions: session, organizations: org } = row;
  const disclose =
    reminder ||
    activity.addressVisibility === 'PUBLIC' ||
    now.getTime() >= session.startsAt.getTime() - TIME.DAY_MS;
  const date = new Intl.DateTimeFormat(DEFAULTS.LOCALE, {
    timeZone: org.timezone,
    dateStyle: 'full',
    timeStyle: 'short',
  });
  const due = Math.max(
    0,
    booking.unitPriceCents - booking.voucherDiscountCents - booking.amountPaidCents,
  );
  return [
    `${SERVICE_MAIL.SUMMARY} ${booking.activityName}`,
    activity.description,
    `${SERVICE_MAIL.HOURS} ${date.format(session.startsAt)} — ${date.format(session.endsAt)} (${org.timezone})`,
    disclose
      ? `${SERVICE_MAIL.ADDRESS} ${activity.address || SERVICE_MAIL.MISSING_ADDRESS}`
      : SERVICE.DELAYED_NOTICE,
    activity.practicalInfo ? `${SERVICE_MAIL.PRACTICAL} ${activity.practicalInfo}` : '',
    `${SERVICE_MAIL.RECEIVED} ${formatMoney(booking.amountPaidCents, booking.currency)}`,
    due ? `${SERVICE_MAIL.DUE} ${formatMoney(due, booking.currency)}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}
