import type { PortalBooking } from '../ports/portal-models';
import type { OrganizationAccess } from './subscription-access';
import { hasCommercialAccess } from './subscription-access';
import { SERVICE } from '../../config/service';
import { BILLING_UI, TIME } from '../../config/constants';
export type StatusTone = 'green' | 'orange' | 'red' | 'neutral';
export interface StatusIndicator {
  readonly tone: StatusTone;
  readonly label: string;
}
export function paymentIndicator(
  booking: Pick<
    PortalBooking,
    'status' | 'unitPriceCents' | 'amountPaidCents' | 'voucherDiscountCents' | 'lockedUntil'
  >,
  now = new Date(),
): StatusIndicator {
  if (booking.status.startsWith('CANCELLED')) return { tone: 'neutral', label: SERVICE.CANCELLED };
  if (booking.status === 'EXPIRED' || (booking.lockedUntil && booking.lockedUntil <= now))
    return { tone: 'red', label: SERVICE.EXPIRED };
  if (booking.status === 'PROOF_SUBMITTED') return { tone: 'orange', label: SERVICE.PROOF };
  if (booking.status !== 'CONFIRMED') return { tone: 'orange', label: SERVICE.DUE };
  if (booking.unitPriceCents === 0) return { tone: 'green', label: SERVICE.FREE };
  if ((booking.voucherDiscountCents ?? 0) >= booking.unitPriceCents)
    return { tone: 'green', label: SERVICE.COVERED };
  return booking.amountPaidCents + (booking.voucherDiscountCents ?? 0) >= booking.unitPriceCents
    ? { tone: 'green', label: SERVICE.PAID }
    : { tone: 'orange', label: SERVICE.DUE };
}
export function accessIndicator(access: OrganizationAccess, now = new Date()): StatusIndicator {
  if (access.suspendedAt) return { tone: 'red', label: BILLING_UI.SUSPENDED };
  if (access.complimentary) return { tone: 'green', label: BILLING_UI.COMPLIMENTARY };
  if (hasCommercialAccess(access, now)) {
    const soon =
      access.cancelAtPeriodEnd &&
      access.currentPeriodEnd &&
      access.currentPeriodEnd.getTime() - now.getTime() <=
        SERVICE.EXPIRY_WARNING_DAYS * TIME.DAY_MS;
    return { tone: soon ? 'orange' : 'green', label: soon ? SERVICE.SOON : BILLING_UI.ACTIVE };
  }
  if (access.status === 'PAST_DUE') return { tone: 'red', label: BILLING_UI.PAST_DUE };
  return access.currentPeriodEnd
    ? { tone: 'red', label: BILLING_UI.CANCELED }
    : { tone: 'neutral', label: BILLING_UI.INACTIVE };
}
