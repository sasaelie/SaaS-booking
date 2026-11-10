import { sql } from 'drizzle-orm';
import { JOB_TYPES } from '../../../config/constants';
export interface CancellationScope {
  readonly organizationId: string;
  readonly bookingIds: readonly string[];
}
export function cancellationScope(scope?: CancellationScope) {
  return scope
    ? sql`AND organization_id=${scope.organizationId} AND type=${JOB_TYPES.CANCELLATION} AND payload->>'bookingId' IN (${sql.join(
        scope.bookingIds.map((id) => sql`${id}`),
        sql`,`,
      )})`
    : sql``;
}
