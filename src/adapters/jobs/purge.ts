import { eq } from 'drizzle-orm';
import { bookings } from '../db/schema';
import type { DrizzlePgDb } from '../db/client';
import type { PrivateProofStoragePort } from '../../core/ports/bank.port';
import { ok, type Result } from '../../lib/result';
import { PurgeJobSchema } from './job-validation';
import { accountingArchiveUntil } from '../../core/domain/accounting-retention';
export async function purgeProof(
  db: DrizzlePgDb,
  storage: PrivateProofStoragePort,
  payload: unknown,
): Promise<Result<{ readonly preserveProof?: true }>> {
  const input = PurgeJobSchema.parse(payload);
  const [protectedBooking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, input.bookingId));
  if (
    protectedBooking?.legalHold ||
    protectedBooking?.disputeOpen ||
    (protectedBooking?.proofIsAccounting &&
      accountingArchiveUntil(protectedBooking.paidAt, protectedBooking.createdAt) > new Date())
  )
    return ok({ preserveProof: true });
  if (input.onlyIfUnattached) {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, input.bookingId));
    if (booking?.proofStorageKey === input.storageKey) return ok({ preserveProof: true });
  }
  const deleted = await storage.deleteProofImmediately(input.storageKey);
  return deleted.ok ? ok({}) : deleted;
}
