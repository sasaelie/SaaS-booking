import { canUsePro } from './commercial';
export interface OrganizationAccess {
  readonly stripeCustomerId?: string | null;
  readonly graceUntil?: Date | null;
  readonly billingInterval?: string | null;
  readonly libertyActivityIds?: readonly string[];
  readonly organizationId: string;
  readonly complimentary: boolean;
  readonly suspendedAt: Date | null;
  readonly status: string;
  readonly currentPeriodEnd: Date | null;
  readonly cancelAtPeriodEnd: boolean;
}
export function hasCommercialAccess(access: OrganizationAccess, now: Date): boolean {
  return canUsePro(access, now);
}
