'use client';
import { useState } from 'react';
import type { BookingPageData } from '../../core/use-cases/get-booking-page.use-case';
import { CALENDAR_UI } from '../../config/constants';
import { localDay, monthOf, shiftMonth } from './calendar-dates';
import { calendarSlots, firstInMonth } from './calendar-slots';
export interface BookingSlotsProps {
  readonly slots: BookingPageData['slots'];
  readonly timezone: string;
  readonly selected: string;
  readonly onSelect: (iso: string) => void;
}
export function useBookingCalendar(props: BookingSlotsProps) {
  const selectedDay = props.selected ? localDay(props.selected, props.timezone) : '';
  const firstDay = props.slots[0] ? localDay(props.slots[0].startsAtIso, props.timezone) : '';
  const initialMonth = monthOf(
    selectedDay || firstDay || localDay(new Date().toISOString(), CALENDAR_UI.UTC),
  );
  const [month, setMonth] = useState(initialMonth);
  const days = calendarSlots(props);
  const availableDays = [...days]
    .filter(([, slots]) => slots.some((slot) => slot.isBookable))
    .map(([day]) => day);
  function selectDay(day: string) {
    const first = days.get(day)?.find((slot) => slot.isBookable);
    if (first) props.onSelect(first.startsAtIso);
  }
  function move(direction: number) {
    const next = shiftMonth(month, direction);
    setMonth(next);
    props.onSelect(firstInMonth(props, next));
  }
  return {
    month,
    selectedDay,
    selectDay,
    visibleSlots: monthOf(selectedDay) === month ? (days.get(selectedDay) ?? []) : [],
    availableDays: new Set(availableDays),
    previous: shiftMonth(month, -1) >= monthOf(firstDay),
    next: shiftMonth(month, 1) <= monthOf([...days.keys()].at(-1) ?? firstDay),
    move,
  };
}
export type BookingCalendarState = ReturnType<typeof useBookingCalendar>;
