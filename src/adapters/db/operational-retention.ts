import { sql, eq } from 'drizzle-orm';
import type { DrizzlePgDb } from './client';
import { atomic, rows } from './transaction';
import { bookings, accountingArchives } from './schema';
import { enqueue } from './jobs/enqueue';
import { accountingArchiveUntil } from '../../core/domain/accounting-retention';
import { COMMERCIAL } from '../../config/commercial';
import { JOB_TYPES, TIME } from '../../config/constants';
import { ok } from '../../lib/result';
import { expireAccountingArchives } from './accounting-expiry';
export async function retainOperational(db: DrizzlePgDb, now: Date, dryRun: boolean) {
  const cutoff = new Date(now.getTime() - COMMERCIAL.OPERATIONAL_RETENTION_DAYS * TIME.DAY_MS);
  return atomic(db, 'OperationalRetention', async (tx) => {
    if (!dryRun) await expireAccountingArchives(tx, now);
    const candidates = await rows<{ id: string; organization_id: string; closed_at: Date }>(
      tx,
      sql`
      SELECT b.id,b.organization_id,GREATEST(s.ends_at,b.cancelled_at,b.paid_at,b.refund_updated_at,
        (SELECT max(COALESCE(v.used_at,v.expires_at)) FROM reschedule_vouchers v WHERE v.organization_id=b.organization_id AND v.origin_booking_id=b.id),
        (SELECT max(e.created_at) FROM financial_entries e WHERE e.organization_id=b.organization_id AND e.booking_id=b.id)) AS closed_at
      FROM bookings b JOIN sessions s ON s.id=b.session_id AND s.organization_id=b.organization_id
      WHERE b.anonymized_at IS NULL AND NOT b.legal_hold AND NOT b.dispute_open AND s.ends_at<=${cutoff}
        AND (b.locked_until IS NULL OR b.locked_until<=${now})
        AND COALESCE(b.refund_status,'') NOT IN ('PENDING','MANUAL_PENDING','FAILED')
        AND NOT EXISTS(SELECT 1 FROM reschedule_vouchers v WHERE v.organization_id=b.organization_id AND v.origin_booking_id=b.id AND v.status IN ('ACTIVE','LOCKED_PENDING_PAYMENT') AND v.expires_at>${now})
        AND NOT EXISTS(SELECT 1 FROM outbox_jobs j WHERE j.organization_id=b.organization_id AND j.payload->>'bookingId'=b.id::text AND j.completed_at IS NULL AND j.type IN ('REFUND','FINANCIAL_RECONCILE'))
        AND GREATEST(s.ends_at,b.cancelled_at,b.paid_at,b.refund_updated_at,
          (SELECT max(COALESCE(v.used_at,v.expires_at)) FROM reschedule_vouchers v WHERE v.organization_id=b.organization_id AND v.origin_booking_id=b.id),
          (SELECT max(e.created_at) FROM financial_entries e WHERE e.organization_id=b.organization_id AND e.booking_id=b.id))<=${cutoff}
      ORDER BY b.id LIMIT ${COMMERCIAL.RETENTION_BATCH_SIZE} FOR UPDATE OF b SKIP LOCKED`,
    );
    if (!dryRun)
      for (const row of candidates)
        await scrubOperational(tx, row.id, now, new Date(row.closed_at));
    return ok({
      dryRun,
      eligible: candidates.map((row) => ({
        bookingId: row.id,
        organizationId: row.organization_id,
      })),
      anonymizedCount: dryRun ? 0 : candidates.length,
    });
  });
}
async function scrubOperational(
  tx: Parameters<Parameters<DrizzlePgDb['transaction']>[0]>[0],
  id: string,
  now: Date,
  closedAt: Date,
) {
  const [booking] = await tx.select().from(bookings).where(eq(bookings.id, id));
  if (!booking || booking.legalHold || booking.anonymizedAt) return;
  if (booking.amountPaidCents > 0 || booking.proofIsAccounting)
    await tx
      .insert(accountingArchives)
      .values({
        bookingId: id,
        organizationId: booking.organizationId,
        requiredIdentity: { firstName: booking.firstName, lastName: booking.lastName },
        archiveUntil: accountingArchiveUntil(booking.paidAt, booking.createdAt),
      })
      .onConflictDoNothing();
  await tx
    .update(bookings)
    .set({
      firstName: '[anonymous]',
      lastName: '[anonymous]',
      email: 'anonymous@invalid.local',
      phone: null,
      marketingOptIn: false,
      anonymizedAt: now,
      operationsClosedAt: closedAt,
      selfServiceVersion: sql`${bookings.selfServiceVersion}+1`,
    })
    .where(eq(bookings.id, id));
  await tx.execute(sql`UPDATE outbox_jobs SET payload=jsonb_build_object('bookingId',${id}::text),completed_at=COALESCE(completed_at,${now}),last_error=NULL
    WHERE organization_id=${booking.organizationId} AND payload->>'bookingId'=${id} AND type NOT IN ('PURGE','REFUND','FINANCIAL_RECONCILE')`);
  if (booking.proofStorageKey && !booking.proofIsAccounting)
    await enqueue(tx, booking.organizationId, JOB_TYPES.PURGE, `privacy-purge:${id}`, {
      bookingId: id,
      storageKey: booking.proofStorageKey,
    });
}
