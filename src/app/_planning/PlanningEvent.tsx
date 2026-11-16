import type { CSSProperties } from 'react';
import { IceIcon } from '../_ui/IceIcon';
import { PLANNING } from '../../config/planning';
import { AppLink } from '../_ui/AppLink';
import { dayLabel, localDay, timeLabel } from '../_ui/calendar-dates';
import { activityTone, sessionPhase, sessionStatus } from './planning-sessions';
import type { PlanningProps, PositionedSession } from './types';
type EventProps = Pick<PlanningProps, 'timezone' | 'onSelect' | 'selected'> & {
  readonly row: PositionedSession;
  readonly now: number | null;
  readonly rangeStart: number;
};
export function PlanningEvent({ row, timezone, now, rangeStart, selected, onSelect }: EventProps) {
  const { session } = row;
  const phase = sessionPhase(session, now);
  const times = `${timeLabel(session.startsAt, timezone)} – ${timeLabel(session.endsAt, timezone)}`;
  const status = sessionStatus(session, now);
  const label = `${session.name}, ${dayLabel(localDay(session.startsAt, timezone))}, ${times}, ${status}`;
  const common = {
    'data-phase': phase,
    'data-tone': activityTone(session.activityId),
    'data-session': session.id,
    style: eventStyle(row, rangeStart),
    'aria-label': label,
  };
  const content = <EventContent name={session.name} times={times} status={status} />;
  if (session.href)
    return (
      <AppLink {...common} className="planning-event portal-session-link" href={session.href}>
        {content}
        <span className="ice-sr-only">{PLANNING.OPEN}</span>
      </AppLink>
    );
  return (
    <button
      {...common}
      className="planning-event"
      type="button"
      aria-pressed={selected === session.startsAt && phase === 'future' && session.isBookable}
      disabled={!session.isBookable || phase !== 'future'}
      onClick={() => onSelect?.(session.startsAt)}
    >
      {content}
      <span className="ice-sr-only">{PLANNING.CHOOSE}</span>
    </button>
  );
}

function EventContent({
  name,
  times,
  status,
}: {
  readonly name: string;
  readonly times: string;
  readonly status: string;
}) {
  return (
    <>
      <i className="planning-event-light" aria-hidden="true" />
      <span className="planning-selection-mark" aria-hidden="true">
        <IceIcon name="check" />
      </span>
      <strong>{name}</strong>
      <span className="planning-event-meta">
        <span>{times}</span>
        <span>{status}</span>
      </span>
    </>
  );
}

function eventStyle(row: PositionedSession, rangeStart: number): CSSProperties {
  return {
    '--event-top': row.start - rangeStart,
    '--event-duration': row.end - row.start,
    '--event-column': row.column,
    '--event-columns': row.columns,
  } as CSSProperties;
}
