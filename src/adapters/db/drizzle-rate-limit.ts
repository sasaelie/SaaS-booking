import { sql } from 'drizzle-orm';
import { rows } from './transaction';
import type { DrizzlePgDb } from './client';
import type { RateLimitPort } from '../../core/ports/rate-limit.port';
import { sha256 } from '../../lib/sha256';
import { ok, type Result } from '../../lib/result';
import { failure, unexpected } from '../../lib/errors';
import { ERROR_CODES, JOB_RULES } from '../../config/constants';
export class DrizzleRateLimit implements RateLimitPort {
  constructor(private readonly db: DrizzlePgDb) {}
  async accept(key: string): Promise<Result<void>> {
    try {
      const hash = await sha256(key);
      if (!hash.ok) return hash;
      const [record] = await rows<{ requests: number }>(
        this.db,
        sql`INSERT INTO request_limits(key_hash,window_start,requests) VALUES(${hash.value},now(),1) ON CONFLICT(key_hash) DO UPDATE SET requests=CASE WHEN request_limits.window_start<now()-${JOB_RULES.RATE_WINDOW_SECONDS}*interval '1 second' THEN 1 ELSE request_limits.requests+1 END, window_start=CASE WHEN request_limits.window_start<now()-${JOB_RULES.RATE_WINDOW_SECONDS}*interval '1 second' THEN now() ELSE request_limits.window_start END RETURNING requests`,
      );
      return record && record.requests <= JOB_RULES.RATE_MAX_REQUESTS
        ? ok(undefined)
        : failure(ERROR_CODES.RATE_LIMITED, 'RateLimit', 'accept');
    } catch {
      return unexpected('RateLimit', 'accept');
    }
  }
}
