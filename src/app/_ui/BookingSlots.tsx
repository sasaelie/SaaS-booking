'use client';
import { FORM_LABELS } from '../../config/constants';
import { PLANNING } from '../../config/planning';
import { SessionPlanning } from '../_planning/SessionPlanning';
import type { BookingSlotsProps } from './use-booking-calendar';
export function BookingSlots(
  props: BookingSlotsProps & { readonly activityId: string; readonly activityName: string },
) {
  if (!props.slots.length) return <p className="ice-empty">{FORM_LABELS.NO_SLOTS}</p>;
  const sessions = props.slots.map((slot) => ({
    id: `${props.activityId}-${slot.startsAtIso}`,
    activityId: props.activityId,
    name: props.activityName,
    startsAt: slot.startsAtIso,
    endsAt: slot.endsAtIso,
    availability: slot.isBookable
      ? `${slot.availabilityLabel} ${PLANNING.AVAILABLE}`
      : PLANNING.CLOSED,
    isBookable: slot.isBookable,
  }));
  return (
    <SessionPlanning
      sessions={sessions}
      timezone={props.timezone}
      selected={props.selected}
      onSelect={props.onSelect}
    />
  );
}
