import type { StoryTextTone } from '../../config/story';
// src/core/ports/booking-ports.ts
import type { AudiencePolicy, PaymentMode } from '../../config/constants';
import type { AppError, Result } from '../../lib/result';
import type { PausePeriodRule, PersistedSession, TimeSlotRule } from '../domain/session-types';

export interface ActivityWithScheduleConfig {
  readonly commercialAccessAllowed: boolean;
  readonly storyTextTone?: StoryTextTone;
  readonly brandTheme: string;
  readonly participantHue?: number | null;
  readonly hasLogo: boolean;
  readonly hasBackground: boolean;
  readonly id: string;
  readonly organizationId: string;
  readonly organizationName: string;
  readonly timezone: string;
  readonly name: string;
  readonly isActive: boolean;
  readonly bankIban: string | null;
  readonly bankAccountName: string | null;
  readonly merchantAccountId: string | null;
  readonly primaryTextColor: string;
  readonly priceCents: number;
  readonly currency: string;
  readonly audiencePolicy: AudiencePolicy;
  readonly requirePhone: boolean;
  readonly paymentMode: PaymentMode;
  readonly bookingWindowWeeks: number;
  readonly noticeHoursForVoucher: number;
  readonly voucherValidityMonths: number;
  readonly allowExternalBenefitExchange: boolean;
  readonly bookingsBySessionId: Readonly<
    Record<string, readonly import('../domain/session-types').SessionBookingSnapshot[]>
  >;
  readonly weeklySlots: readonly TimeSlotRule[];
  readonly pausePeriods: readonly PausePeriodRule[];
  readonly manualSessions: readonly PersistedSession[];
}
export interface ActivityRepositoryPort {
  getActivityWithScheduleConfig(
    organizationId: string,
    activityId: string,
  ): Promise<Result<ActivityWithScheduleConfig, AppError>>;
}
export interface BookingConfirmationNotificationPayload {
  readonly bookingId: string;
  readonly organizationName: string;
  readonly activityName: string;
  readonly attendeeFirstName: string;
  readonly attendeeEmail: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly timezone: string;
  readonly amountPaidCents: number;
  readonly currency: string;
}
export interface NotificationPort {
  sendBookingConfirmation(
    payload: BookingConfirmationNotificationPayload,
  ): Promise<Result<{ readonly messageId: string }, AppError>>;
}

export interface PublicActivityRepositoryPort extends ActivityRepositoryPort {
  findPublicActivity(slug: string, activityId: string): Promise<Result<ActivityWithScheduleConfig>>;
}
