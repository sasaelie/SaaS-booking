import { sql } from 'drizzle-orm';
import type { DrizzlePgDb } from '../client';
import { atomic, rows } from '../transaction';
import { TIME } from '../../../config/constants';
import { ok } from '../../../lib/result';
export function scheduleReminders(db: DrizzlePgDb, now = new Date()) {
  return atomic(db, 'Reminders', async (tx) => {
    const [result] = await rows<{ count: number }>(
      tx,
      sql`WITH scheduled AS (
 INSERT INTO outbox_jobs(organization_id,type,deduplication_key,payload)
 SELECT b.organization_id,'REMINDER','reminder:' || b.id || ':' || to_char(s.starts_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),jsonb_build_object('bookingId',b.id,'startsAt',to_char(s.starts_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
 FROM bookings b JOIN sessions s ON s.id=b.session_id AND s.organization_id=b.organization_id
 WHERE b.status='CONFIRMED' AND b.anonymized_at IS NULL AND NOT s.is_cancelled
 AND s.starts_at>${now.toISOString()}::timestamptz AND s.starts_at<=${new Date(now.getTime() + TIME.DAY_MS).toISOString()}::timestamptz
 AND b.confirmed_at<=s.starts_at-interval '24 hours'
 ON CONFLICT(deduplication_key) DO NOTHING RETURNING 1)
 SELECT count(*)::int AS count FROM scheduled`,
    );
    return ok(result?.count ?? 0);
  });
}
