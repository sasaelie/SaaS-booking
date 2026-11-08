import { ok, type Result } from '../../lib/result';
import type {
  BuildScheduleInput,
  ComputedCalendarSession,
  PersistedSession,
} from './session-types';
import { validateSchedule, belongsToActivity } from './schedule-validation';
import { localDays, projectSlot } from './schedule-projection';
import { computeSession } from './schedule-session';
export { isOverlappingPause } from './schedule-session';
function addSession(
  session: PersistedSession,
  input: BuildScheduleInput,
  result: Map<number, ComputedCalendarSession>,
): Result<void> {
  const computed = computeSession(session, input);
  if (!computed.ok) return computed;
  if (computed.value) result.set(session.startsAt.getTime(), computed.value);
  return ok(undefined);
}
function addProjections(
  input: BuildScheduleInput,
  days: readonly Date[],
  persisted: ReadonlyMap<number, PersistedSession>,
  result: Map<number, ComputedCalendarSession>,
): Result<void> {
  for (const day of days) {
    for (const slot of input.weeklySlots.filter((row) => belongsToActivity(row, input))) {
      const projected = projectSlot(day, slot, input);
      if (!projected.ok) return projected;
      if (!projected.value || persisted.has(projected.value.startsAt.getTime())) continue;
      const added = addSession(projected.value, input, result);
      if (!added.ok) return added;
    }
  }
  return ok(undefined);
}
export function buildTruthSchedule(
  input: BuildScheduleInput,
): Result<readonly ComputedCalendarSession[]> {
  const validated = validateSchedule(input);
  if (!validated.ok) return validated;
  const filtered = {
    ...input,
    pausePeriods: input.pausePeriods.filter((row) => belongsToActivity(row, input)),
  };
  const days = localDays(filtered);
  if (!days.ok) return days;
  const persisted = new Map(
    input.persistedSessions
      .filter((row) => belongsToActivity(row, input))
      .map((row) => [row.startsAt.getTime(), row]),
  );
  const result = new Map<number, ComputedCalendarSession>();
  for (const session of persisted.values()) {
    const added = addSession(session, filtered, result);
    if (!added.ok) return added;
  }
  const projected = addProjections(filtered, days.value, persisted, result);
  if (!projected.ok) return projected;
  return ok(
    [...result.values()].sort((left, right) => left.startsAt.getTime() - right.startsAt.getTime()),
  );
}
