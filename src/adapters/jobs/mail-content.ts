import { readBookingMail, eventMailDetails } from './event-mail';
import { SERVICE_MAIL } from '../../config/service-mail';
import { formatMoney } from '../../lib/format-money';
import { eq } from 'drizzle-orm';
import type { DrizzlePgDb } from '../db/client';
import { bookings, organizations, rescheduleVouchers } from '../db/schema';
import { signSelfCancelToken } from '../../core/domain/self-service-token';
import { required } from '../db/transaction';
import { TIME, TOKEN_RULES, JOB_TYPES, DEFAULTS } from '../../config/constants';
import { BookingJobSchema, VoucherJobSchema, ReminderJobSchema } from './job-validation';
export interface MailContent {
  readonly to: string;
  readonly subject: string;
  readonly text: string;
}
async function voucherContent(
  db: DrizzlePgDb,
  payload: unknown,
  appUrl: string,
): Promise<MailContent | null> {
  const { voucherId } = VoucherJobSchema.parse(payload);
  const [row] = await db
    .select()
    .from(rescheduleVouchers)
    .innerJoin(bookings, eq(bookings.id, rescheduleVouchers.originBookingId))
    .innerJoin(organizations, eq(organizations.id, rescheduleVouchers.organizationId))
    .where(eq(rescheduleVouchers.id, voucherId));
  if (!row || row.bookings.anonymizedAt || row.bookings.email === 'anonymous@invalid.local')
    return null;
  const voucher = row.reschedule_vouchers;
  if (voucher.status !== 'ACTIVE' || voucher.expiresAt <= new Date()) return null;
  return {
    to: row.bookings.email,
    subject: 'Votre code de report',
    text: `Votre code : ${voucher.code}. Valeur : ${formatMoney(voucher.initialValueCents, voucher.currency)}. Valable jusqu’au ${voucher.expiresAt.toISOString()}. Réserver : ${appUrl}/${row.organizations.slug}/${row.bookings.activityId}#voucher=${encodeURIComponent(voucher.code)}`,
  };
}
async function bookingContent(
  db: DrizzlePgDb,
  type: string,
  payload: unknown,
  appUrl: string,
  secret: string,
): Promise<MailContent | null> {
  const { bookingId } = BookingJobSchema.parse(payload);
  const row = await readBookingMail(db, bookingId);
  if (!row || row.bookings.anonymizedAt || row.bookings.email === 'anonymous@invalid.local')
    return null;
  const booking = row.bookings;
  if (
    type === JOB_TYPES.REMINDER &&
    ReminderJobSchema.parse(payload).startsAt !== row.sessions.startsAt.toISOString()
  )
    return null;
  if (
    type !== JOB_TYPES.CANCELLATION &&
    (booking.status !== 'CONFIRMED' || row.sessions.isCancelled)
  )
    return null;
  if (
    type === JOB_TYPES.REMINDER &&
    (row.sessions.startsAt <= new Date() ||
      row.sessions.startsAt.getTime() > Date.now() + TIME.DAY_MS)
  )
    return null;
  if (type === JOB_TYPES.CANCELLATION)
    return {
      to: booking.email,
      subject: 'Annulation de votre séance',
      text: `La séance ${booking.activityName} a été annulée. Les remboursements éventuels sont en cours de traitement.`,
    };
  const content = await confirmationContent(row, appUrl, secret);
  return enrichedMail(content, row, type);
}

export function mailContent(
  db: DrizzlePgDb,
  type: string,
  payload: unknown,
  appUrl: string,
  secret: string,
): Promise<MailContent | null> {
  return type === JOB_TYPES.VOUCHER
    ? voucherContent(db, payload, appUrl)
    : bookingContent(db, type, payload, appUrl, secret);
}

async function confirmationContent(
  row: NonNullable<Awaited<ReturnType<typeof readBookingMail>>>,
  appUrl: string,
  secret: string,
): Promise<MailContent> {
  const booking = row.bookings;
  const expUnixSeconds = Math.floor(
    (Date.now() + TOKEN_RULES.DURATION_DAYS * TIME.DAY_MS) / TIME.SECOND_MS,
  );
  const token = required(
    await signSelfCancelToken(
      {
        organizationId: booking.organizationId,
        bookingId: booking.id,
        version: booking.selfServiceVersion,
        expUnixSeconds,
      },
      secret,
    ),
  );
  const time = new Intl.DateTimeFormat(DEFAULTS.LOCALE, {
    timeZone: row.organizations.timezone,
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(row.sessions.startsAt);
  return {
    to: booking.email,
    subject: 'Confirmation de votre réservation',
    text: `Votre place pour ${booking.activityName} est confirmée : ${time}. Montant encaissé : ${formatMoney(booking.amountPaidCents, booking.currency)}. Gérer la réservation : ${appUrl}/manage#token=${encodeURIComponent(token)}`,
  };
}

function enrichedMail(
  content: MailContent,
  row: NonNullable<Awaited<ReturnType<typeof readBookingMail>>>,
  type: string,
) {
  return {
    ...content,
    subject:
      type === JOB_TYPES.REMINDER
        ? SERVICE_MAIL.REMINDER
        : type === JOB_TYPES.EVENT_UPDATE
          ? SERVICE_MAIL.UPDATE
          : content.subject,
    text: `${content.text}\n\n${eventMailDetails(row, type === JOB_TYPES.REMINDER)}`,
  };
}
