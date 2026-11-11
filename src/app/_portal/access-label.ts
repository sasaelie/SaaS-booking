import { canUsePro } from '../../core/domain/commercial';
import type { OrganizationAccess } from '../../core/domain/subscription-access';
import { BILLING_UI } from '../../config/constants';
export function accessLabel(access: OrganizationAccess) {
  if (access.suspendedAt) return BILLING_UI.SUSPENDED;
  if (access.complimentary) return BILLING_UI.COMPLIMENTARY;
  if (canUsePro(access, new Date())) return BILLING_UI.ACTIVE;
  if (access.status === 'PAST_DUE') return BILLING_UI.PAST_DUE;
  return 'Liberté';
}
