import { eq } from 'drizzle-orm';
import { organizationAccess } from '../schema/saas';
import { required, type Executor } from '../transaction';
import { hasCommercialAccess } from '../../../core/domain/subscription-access';
import { failure } from '../../../lib/errors';
import { ERROR_CODES } from '../../../config/constants';
export async function requireCommercialAccess(db: Executor, organizationId: string, now: Date) {
  const [access] = await db
    .select()
    .from(organizationAccess)
    .where(eq(organizationAccess.organizationId, organizationId))
    .for('share');
  if (!access || !hasCommercialAccess(access, now))
    required(failure(ERROR_CODES.SUBSCRIPTION_REQUIRED, 'Access', 'commercial'));
}
