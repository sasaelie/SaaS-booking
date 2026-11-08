import { sql } from 'drizzle-orm';
import { rows, required, type Transaction, type Executor } from '../transaction';
import { failure } from '../../../lib/errors';
import { ERROR_CODES, MEMBER_ROLES } from '../../../config/constants';
import type { PortalActor } from '../../../core/ports/portal-models';
export async function requireMembership(
  tx: Transaction,
  actor: PortalActor,
  organizationId: string,
  owner = false,
) {
  const [member] = await rows<{ role: string }>(
    tx,
    sql`SELECT role FROM organization_members
  WHERE organization_id=${organizationId} AND user_id=${actor.id} FOR SHARE`,
  );
  if (!member || (owner && member.role !== MEMBER_ROLES.OWNER))
    required(failure(ERROR_CODES.UNAUTHORIZED, 'Portal', 'member'));
}
export async function isPlatformOperator(db: Executor, actor: PortalActor) {
  const [operator] = await rows<{ user_id: string }>(
    db,
    sql`SELECT user_id FROM platform_operators WHERE user_id=${actor.id}`,
  );
  return Boolean(operator);
}
export async function requireOperator(tx: Transaction, actor: PortalActor) {
  const [operator] = await rows<{ user_id: string }>(
    tx,
    sql`SELECT user_id FROM platform_operators WHERE user_id=${actor.id} FOR SHARE`,
  );
  if (!operator) required(failure(ERROR_CODES.UNAUTHORIZED, 'Platform', 'operator'));
}
