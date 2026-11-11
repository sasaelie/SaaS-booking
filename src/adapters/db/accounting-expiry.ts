import { sql } from 'drizzle-orm';
import type { Transaction } from './transaction';
import { rows } from './transaction';
import { enqueue } from './jobs/enqueue';
import { JOB_TYPES } from '../../config/constants';
export async function expireAccountingArchives(tx: Transaction, now: Date) {
  const expired = await rows<{
    booking_id: string;
    organization_id: string;
    proof_storage_key: string | null;
  }>(
    tx,
    sql`
    SELECT a.booking_id,a.organization_id,b.proof_storage_key FROM accounting_archives a
    JOIN bookings b ON b.id=a.booking_id AND b.organization_id=a.organization_id
    WHERE a.archive_until<=${now} AND NOT b.legal_hold AND NOT b.dispute_open AND b.anonymized_at IS NOT NULL
    FOR UPDATE OF a,b SKIP LOCKED`,
  );
  for (const row of expired) {
    if (row.proof_storage_key)
      await enqueue(
        tx,
        row.organization_id,
        JOB_TYPES.PURGE,
        `accounting-expiry:${row.booking_id}`,
        { bookingId: row.booking_id, storageKey: row.proof_storage_key },
      );
    await tx.execute(
      sql`DELETE FROM accounting_archives WHERE booking_id=${row.booking_id} AND organization_id=${row.organization_id}`,
    );
    await tx.execute(sql`UPDATE bookings SET payment_reference=NULL,checkout_reference=NULL,checkout_url=NULL,
      request_hash=gen_random_uuid()::text,idempotency_key=gen_random_uuid()::text
      WHERE id=${row.booking_id} AND organization_id=${row.organization_id}`);
    await tx.execute(sql`UPDATE financial_payments SET payment_reference=NULL,charge_id=NULL,balance_transaction_id=NULL,transfer_id=NULL,payout_id=NULL
      WHERE booking_id=${row.booking_id} AND organization_id=${row.organization_id}`);
    await tx.execute(
      sql`UPDATE financial_entries SET reference=NULL WHERE booking_id=${row.booking_id} AND organization_id=${row.organization_id}`,
    );
  }
  return expired.length;
}
