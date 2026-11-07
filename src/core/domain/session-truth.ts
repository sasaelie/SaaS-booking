// src/core/domain/session-truth.ts
import { ok, type AppError, type Result } from '../../lib/result';
import { calculateSeatAvailability } from './seat-calculator';
import type {
  BuildScheduleInput,
  ComputedCalendarSession,
  PausePeriodRule,
  PersistedSession,
} from './session-types';
import { localDayAndTimeToUtc } from './timezone';
const MS_PER_DAY = 86_400_000;
const DAYS_PER_WEEK = 7;

export function isOverlappingPause(
  startsAt: Date,
  endsAt: Date,
  pauses: readonly PausePeriodRule[],
): boolean {
  const startMs = startsAt.getTime();
  const endMs = endsAt.getTime();
  for (const pause of pauses) {
    if (startMs < pause.endsAt.getTime() && endMs > pause.startsAt.getTime())
      return true;
  }
  return false;
}
function buildWindowHorizon(now: Date, bookingWindowWeeks: number): Date {
  return new Date(
    now.getTime() + bookingWindowWeeks * DAYS_PER_WEEK * MS_PER_DAY,
  );
}
function toComputedSession(
  activityId: string,
  persisted: PersistedSession | null,
  startsAt: Date,
  endsAt: Date,
  capacity: number,
  isManual: boolean,
  input: BuildScheduleInput,
): Result<ComputedCalendarSession, AppError> {
  const bookings =
    persisted !== null ? (input.bookingsBySessionId[persisted.id] ?? []) : [];
  const availabilityRes = calculateSeatAvailability(
    capacity,
    bookings,
    input.now,
  );
  if (!availabilityRes.ok) return availabilityRes;
  return ok({
    activityId,
    persistedSessionId: persisted?.id ?? null,
    startsAt,
    endsAt,
    isManual,
    availability: availabilityRes.value,
  });
}
export function buildTruthSchedule(
  input: BuildScheduleInput,
): Result<readonly ComputedCalendarSession[], AppError> {
  const persistedByStartMs = new Map<number, PersistedSession>();
  for (const session of input.persistedSessions)
    persistedByStartMs.set(session.startsAt.getTime(), session);
  const windowHorizon = buildWindowHorizon(input.now, input.bookingWindowWeeks);
  const resultsByStartMs = new Map<number, ComputedCalendarSession>();
  const startDayUtc = Date.UTC(
    input.rangeStart.getUTCFullYear(),
    input.rangeStart.getUTCMonth(),
    input.rangeStart.getUTCDate(),
  );
  const endDayUtc = Date.UTC(
    input.rangeEnd.getUTCFullYear(),
    input.rangeEnd.getUTCMonth(),
    input.rangeEnd.getUTCDate(),
  );
  for (let dayMs = startDayUtc; dayMs <= endDayUtc; dayMs += MS_PER_DAY) {
    const cursor = new Date(dayMs);
    const dayOfWeek = cursor.getUTCDay();
    for (const slot of input.weeklySlots) {
      if (slot.dayOfWeek !== dayOfWeek) continue;
      const startRes = localDayAndTimeToUtc(
        cursor.getUTCFullYear(),
        cursor.getUTCMonth(),
        cursor.getUTCDate(),
        slot.startTimeLocal,
        input.timezone,
      );
      if (!startRes.ok) return startRes;
      const endRes = localDayAndTimeToUtc(
        cursor.getUTCFullYear(),
        cursor.getUTCMonth(),
        cursor.getUTCDate(),
        slot.endTimeLocal,
        input.timezone,
      );
      if (!endRes.ok) return endRes;
      const startsAt = startRes.value;
      const endsAt = endRes.value;
      if (startsAt.getTime() <= input.now.getTime()) continue;
      if (startsAt.getTime() > windowHorizon.getTime()) continue;
      if (isOverlappingPause(startsAt, endsAt, input.pausePeriods)) continue;
      const persisted = persistedByStartMs.get(startsAt.getTime()) ?? null;
      if (persisted?.isCancelled === true) continue;
      const computed = toComputedSession(
        input.activityId,
        persisted,
        startsAt,
        endsAt,
        persisted?.capacity ?? slot.capacity,
        false,
        input,
      );
      if (!computed.ok) return computed;
      resultsByStartMs.set(startsAt.getTime(), computed.value);
    }
  }
  for (const manual of input.persistedSessions) {
    if (!manual.isManual || manual.isCancelled) continue;
    if (manual.startsAt.getTime() <= input.now.getTime()) continue;
    if (manual.startsAt.getTime() < input.rangeStart.getTime()) continue;
    if (manual.startsAt.getTime() > input.rangeEnd.getTime()) continue;
    const computed = toComputedSession(
      input.activityId,
      manual,
      manual.startsAt,
      manual.endsAt,
      manual.capacity,
      true,
      input,
    );
    if (!computed.ok) return computed;
    resultsByStartMs.set(manual.startsAt.getTime(), computed.value);
  }
  const sorted = Array.from(resultsByStartMs.values()).sort(
    (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
  );
  return ok(sorted);
}
