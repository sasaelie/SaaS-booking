import { sql, eq } from 'drizzle-orm';
import { outboxJobs } from '../schema';
import { rows, atomic } from '../transaction';
import type { DrizzlePgDb } from '../client';
import { cancellationScope, type CancellationScope } from './job-filter';
import { JOB_RULES, JOB_TYPES, TIME } from '../../../config/constants';
import { ok } from '../../../lib/result';
export function claimJob(db: DrizzlePgDb, scope?: CancellationScope) {
  return atomic(db, 'Jobs', async (tx) => {
    const [candidate] = await rows<{ id: string }>(
      tx,
      sql`SELECT id FROM outbox_jobs WHERE completed_at IS NULL AND available_at<=now() ${cancellationScope(scope)}
        ORDER BY available_at,id FOR UPDATE SKIP LOCKED LIMIT 1`,
    );
    if (!candidate) return ok(null);
    const now = new Date();
    const [job] = await tx
      .update(outboxJobs)
      .set({
        availableAt: new Date(now.getTime() + JOB_RULES.LEASE_MINUTES * TIME.MINUTE_MS),
        payload: sql`CASE WHEN ${outboxJobs.type}=${JOB_TYPES.REFUND} AND NOT (${outboxJobs.payload} ? 'firstAttemptAt')
          THEN ${outboxJobs.payload} || jsonb_build_object('firstAttemptAt',${now.toISOString()}::text) ELSE ${outboxJobs.payload} END`,
      })
      .where(eq(outboxJobs.id, candidate.id))
      .returning();
    return ok(job ?? null);
  });
}
