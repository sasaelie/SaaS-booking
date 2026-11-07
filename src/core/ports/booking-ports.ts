// src/core/ports/booking-ports.ts
import type { AudiencePolicy, PaymentMode } from '../../config/constants';
import type { AppError, Result } from '../../lib/result';
import type {
  PausePeriodRule,
  PersistedSession,
  TimeSlotRule,
} from '../domain/session-types';

export interface ActivityWithScheduleConfig {
  readonly id: string;
  readonly organizationId: string;
  readonly organizationName: string;
  readonly timezone: string;
  readonly name: string;
  readonly priceCents: number;
  readonly currency: string;
  readonly audiencePolicy: AudiencePolicy;
  readonly requirePhone: boolean;
  readonly paymentMode: PaymentMode;
  readonly bookingWindowWeeks: number;
  readonly noticeHoursForVoucher: number;
  readonly voucherValidityMonths: number;
  readonly allowExternalBenefitExchange: boolean;
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
