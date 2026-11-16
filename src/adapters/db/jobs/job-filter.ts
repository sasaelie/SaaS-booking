import { sql } from 'drizzle-orm';
import { JOB_TYPES } from '../../../config/constants';
export interface NotificationScope {
  readonly organizationId: string;
  readonly bookingIds: readonly string[];
  readonly type: typeof JOB_TYPES.CONFIRMATION | typeof JOB_TYPES.CANCELLATION;
}
export function notificationScope(scope?: NotificationScope) {
  return scope
    ? sql`AND organization_id=${scope.organizationId} AND type=${scope.type} AND payload->>'bookingId' IN (${sql.join(
        scope.bookingIds.map((id) => sql`${id}`),
        sql`,`,
      )})`
    : sql``;
}
