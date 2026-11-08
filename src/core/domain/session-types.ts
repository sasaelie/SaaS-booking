// src/core/domain/session-types.ts
import type { BookingStatus } from '../../config/constants';

export interface TimeSlotRule {
  readonly organizationId: string;
  readonly id: string;
  readonly activityId: string;
  readonly dayOfWeek: number;
  readonly startTimeLocal: string;
  readonly endTimeLocal: string;
  readonly capacity: number;
}
export interface PausePeriodRule {
  readonly organizationId: string;
  readonly id: string;
  readonly activityId: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
}
export interface PersistedSession {
  readonly organizationId: string;
  readonly id: string;
  readonly activityId: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly capacity: number;
  readonly isManual: boolean;
  readonly isCancelled: boolean;
}
export interface SessionBookingSnapshot {
  readonly id: string;
  readonly sessionId: string;
  readonly status: BookingStatus;
  readonly lockedUntil: Date | null;
}
export interface SeatAvailability {
  readonly capacity: number;
  readonly occupiedSeats: number;
  readonly remainingSeats: number;
  readonly displayLabel: string;
  readonly isBookable: boolean;
}
export interface ComputedCalendarSession {
  readonly activityId: string;
  readonly persistedSessionId: string | null;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly isManual: boolean;
  readonly availability: SeatAvailability;
}
export interface BuildScheduleInput {
  readonly organizationId: string;
  readonly activityId: string;
  readonly timezone: string;
  readonly bookingWindowWeeks: number;
  readonly now: Date;
  readonly rangeStart: Date;
  readonly rangeEnd: Date;
  readonly weeklySlots: readonly TimeSlotRule[];
  readonly pausePeriods: readonly PausePeriodRule[];
  readonly persistedSessions: readonly PersistedSession[];
  readonly bookingsBySessionId: Readonly<Record<string, readonly SessionBookingSnapshot[]>>;
}
