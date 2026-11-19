'use client';
import { useState, useRef, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import type { BookingActionState } from '../actions/booking.actions';
import type { BookingPageData } from '../../core/use-cases/get-booking-page.use-case';
import { usePlanningClock } from '../_planning/use-planning-clock';
import { submitBooking } from './booking-submission';
export function useBookingForm(data: BookingPageData) {
  const router = useRouter();
  const now = usePlanningClock();
  const [selected, setSelected] = useState(
    () => data.slots.find((slot) => slot.isBookable)?.startsAtIso ?? '',
  );
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<BookingActionState | null>(null);
  const request = useRef({ fingerprint: '', key: '' });
  const inFlight = useRef(false);
  const selectedIso =
    data.slots.find(
      (slot) =>
        slot.startsAtIso === selected &&
        slot.isBookable &&
        (now === null || Date.parse(slot.startsAtIso) > now),
    )?.startsAtIso ?? '';
  function chooseSession(iso: string) {
    setSelected(iso);
    setState(null);
  }
  const context = {
    data,
    selectedIso,
    request,
    inFlight,
    setPending,
    setState,
    refresh: router.refresh,
  };
  return {
    ready: now !== null,
    selectedIso,
    setSelected: chooseSession,
    pending,
    state,
    submit: (event: FormEvent<HTMLFormElement>) => submitBooking(event, context),
  };
}
