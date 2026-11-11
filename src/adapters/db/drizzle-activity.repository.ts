import { atomic } from './transaction';
import { initializeCommercialSelection } from './commercial-access';
import { and, eq } from 'drizzle-orm';
import type {
  ActivityRepositoryPort,
  ActivityWithScheduleConfig,
} from '../../core/ports/booking-ports';
import { failure, unexpected } from '../../lib/errors';
import { ERROR_CODES } from '../../config/constants';
import type { Result } from '../../lib/result';
import { activities, organizations } from './schema';
import { readActivity } from './activity-reader';
import type { DrizzlePgDb } from './client';
export class DrizzleActivityRepository implements ActivityRepositoryPort {
  constructor(private readonly db: DrizzlePgDb) {}
  async getActivityWithScheduleConfig(
    organizationId: string,
    activityId: string,
  ): Promise<Result<ActivityWithScheduleConfig>> {
    try {
      return await readActivity(this.db, organizationId, activityId);
    } catch {
      return unexpected('ActivityRepository', 'getActivityWithScheduleConfig');
    }
  }
  async findPublicActivity(
    slug: string,
    activityId: string,
  ): Promise<Result<ActivityWithScheduleConfig>> {
    return atomic(this.db, 'PublicActivity', async (tx) => {
      const [row] = await tx
        .select({ organizationId: organizations.id })
        .from(organizations)
        .innerJoin(activities, eq(activities.organizationId, organizations.id))
        .where(
          and(
            eq(organizations.slug, slug),
            eq(activities.id, activityId),
            eq(activities.isActive, true),
          ),
        );
      if (row) await initializeCommercialSelection(tx, row.organizationId);
      return row
        ? readActivity(tx, row.organizationId, activityId)
        : failure(ERROR_CODES.NOT_FOUND, 'ActivityRepository', 'findPublicActivity');
    });
  }
}
