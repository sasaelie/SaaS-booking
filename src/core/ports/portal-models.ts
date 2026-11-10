import type { EventDetails, SocialLinks } from './event-details';
import type { StoryTextTone } from '../../config/story';
import type { AudiencePolicy, PaymentMode, BookingStatus } from '../../config/constants';
import type { OrganizationAccess } from '../domain/subscription-access';
export interface PortalActor {
  readonly id: string;
  readonly name: string;
  readonly email: string;
}
export interface OrganizationSummary {
  readonly socialLinks?: SocialLinks;
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly kind: string;
  readonly timezone: string;
  readonly role: string;
  readonly access: OrganizationAccess;
  readonly bankIban: string | null;
  readonly bankAccountName: string | null;
  readonly merchantAccountId: string | null;
  readonly stripeReady: boolean;
  readonly usesPlatformPayments: boolean;
  readonly primaryTextColor: string;
  readonly autoDeleteBankProof: boolean;
  readonly organizerHue: number | null;
  readonly participantHue: number | null;
  readonly storyTextTone: StoryTextTone;
  readonly theme: string;
  readonly hasLogo: boolean;
  readonly hasBackground: boolean;
}
export interface PortalActivity extends EventDetails {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly priceCents: number;
  readonly currency: string;
  readonly paymentMode: PaymentMode;
  readonly audiencePolicy: AudiencePolicy;
  readonly requirePhone: boolean;
  readonly isActive: boolean;
  readonly bookingWindowWeeks: number;
  readonly noticeHoursForVoucher: number;
  readonly voucherValidityMonths: number;
  readonly weeklySlots: readonly {
    readonly dayOfWeek: number;
    readonly startTimeLocal: string;
    readonly endTimeLocal: string;
    readonly capacity: number;
  }[];
}
export interface PortalSession {
  readonly id: string | null;
  readonly availabilityLabel: string;
  readonly activityId: string;
  readonly activityName: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly capacity: number;
  readonly isManual: boolean;
  readonly isCancelled: boolean;
}
export interface PortalBooking {
  readonly canIssueVoucher?: boolean;
  readonly vouchers?: readonly {
    readonly kind: string;
    readonly code: string;
    readonly initialValueCents: number;
    readonly currency: string;
    readonly status: string;
    readonly expiresAt: string;
  }[];
  readonly id: string;
  readonly activityName: string;
  readonly sessionId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly phone: string | null;
  readonly status: BookingStatus;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly voucherDiscountCents?: number;
  readonly amountPaidCents: number;
  readonly unitPriceCents: number;
  readonly currency: string;
  readonly paymentMode: PaymentMode;
  readonly hasProof: boolean;
  readonly refundStatus: string | null;
  readonly refundDeadline: Date | null;
  readonly lockedUntil: Date | null;
}
export interface PortalOverview {
  readonly organization: OrganizationSummary;
  readonly activities: readonly PortalActivity[];
  readonly sessions: readonly PortalSession[];
  readonly bookingCount: number;
  readonly pendingProofCount: number;
  readonly pendingRefundCount: number;
}
export interface PortalBookingPage {
  readonly bookings: readonly PortalBooking[];
  readonly total: number;
  readonly page: number;
}
export interface PlatformOrganization {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly kind: string;
  readonly ownerEmail: string | null;
  readonly createdAt: Date;
  readonly access: OrganizationAccess;
  readonly activityCount: number;
  readonly bookingCount: number;
}
export interface PlatformOverview {
  readonly organizations: readonly PlatformOrganization[];
  readonly total: number;
  readonly activeCount: number;
  readonly complimentaryCount: number;
  readonly pastDueCount: number;
  readonly deferredJobs: number;
}
