import { ACCESS_STATUSES } from '../../config/constants';
export interface OrganizationAccess {
  readonly organizationId: string;
  readonly complimentary: boolean;
  readonly suspendedAt: Date | null;
  readonly status: string;
  readonly currentPeriodEnd: Date | null;
  readonly cancelAtPeriodEnd: boolean;
}
export function hasCommercialAccess(access: OrganizationAccess, now: Date): boolean {
  if (access.suspendedAt !== null || !Number.isFinite(now.getTime())) return false;
  if (access.complimentary) return true;
  return (
    access.status === ACCESS_STATUSES.ACTIVE &&
    access.currentPeriodEnd !== null &&
    Number.isFinite(access.currentPeriodEnd.getTime()) &&
    access.currentPeriodEnd.getTime() > now.getTime()
  );
}
