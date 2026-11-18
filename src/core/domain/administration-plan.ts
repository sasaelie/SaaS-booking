import { effectivePlan } from './commercial';
import type { OrganizationAccess } from './subscription-access';
export function administrationPlan(access: OrganizationAccess, now: Date) {
  return effectivePlan({ ...access, suspendedAt: null }, now);
}
