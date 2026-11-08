import { and, eq } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
export function tenantActivity(
  table: { organizationId: AnyPgColumn; activityId: AnyPgColumn },
  organizationId: string,
  activityId: string,
) {
  return and(eq(table.organizationId, organizationId), eq(table.activityId, activityId));
}
