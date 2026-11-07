// src/core/domain/__tests__/milestone1.test.ts
import { describe, expect, it } from 'vitest';
import { BOOKING_STATUSES } from '../../../config/constants';
import { calculateSeatAvailability } from '../seat-calculator';
import { buildTruthSchedule } from '../session-truth';
import type { SessionBookingSnapshot, TimeSlotRule } from '../session-types';
describe('Jalon 1 — Règle de vérité des séances & Comptage des places', () => {
  const NOW = new Date('2026-11-09T08:00:00.000Z');
  const WEDNESDAY_SLOT: TimeSlotRule = {
    id: 'slot-wed',
    activityId: 'act-kids',
    dayOfWeek: 3,
    startTimeLocal: '14:00',
    endTimeLocal: '16:00',
    capacity: 5,
  };
  it('calcule "2 / 5" en comptant les confirmées et les blocages non expirés, tout en ignorant les blocages expirés', () => {
    const bookings: SessionBookingSnapshot[] = [
      {
        id: 'b1',
        sessionId: 's1',
        status: BOOKING_STATUSES.CONFIRMED,
        lockedUntil: null,
      },
      {
        id: 'b2',
        sessionId: 's1',
        status: BOOKING_STATUSES.PENDING_PAYMENT,
        lockedUntil: new Date('2026-11-09T08:25:00.000Z'),
      },
      {
        id: 'b3',
        sessionId: 's1',
        status: BOOKING_STATUSES.PROOF_SUBMITTED,
        lockedUntil: new Date('2026-11-10T08:00:00.000Z'),
      },
      {
        id: 'b4',
        sessionId: 's1',
        status: BOOKING_STATUSES.PENDING_PAYMENT,
        lockedUntil: new Date('2026-11-09T07:55:00.000Z'),
      },
    ];
    const res = calculateSeatAvailability(5, bookings, NOW);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.occupiedSeats).toBe(3);
      expect(res.value.remainingSeats).toBe(2);
      expect(res.value.displayLabel).toBe('2 / 5');
      expect(res.value.isBookable).toBe(true);
    }
  });
  it('bloque la réservation (isBookable = false) lorsque le compteur tombe à "0 / 5"', () => {
    const bookings: SessionBookingSnapshot[] = Array.from(
      { length: 5 },
      (_, idx) => ({
        id: `b-${idx}`,
        sessionId: 's1',
        status: BOOKING_STATUSES.CONFIRMED,
        lockedUntil: null,
      }),
    );
    const res = calculateSeatAvailability(5, bookings, NOW);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.displayLabel).toBe('0 / 5');
      expect(res.value.isBookable).toBe(false);
    }
  });
  it('applique la Règle de vérité : une pause supprime le modèle, mais une séance à date précise l’emporte sur la pause et la fenêtre', () => {
    const scheduleRes = buildTruthSchedule({
      activityId: 'act-kids',
      timezone: 'Europe/Brussels',
      bookingWindowWeeks: 2,
      now: NOW,
      rangeStart: new Date('2026-11-09T00:00:00.000Z'),
      rangeEnd: new Date('2026-12-15T23:59:59.000Z'),
      weeklySlots: [WEDNESDAY_SLOT],
      pausePeriods: [
        {
          id: 'pause-nov-18',
          activityId: 'act-kids',
          startsAt: new Date('2026-11-18T00:00:00.000Z'),
          endsAt: new Date('2026-11-18T23:59:59.000Z'),
        },
      ],
      persistedSessions: [
        {
          id: 'manual-during-pause',
          activityId: 'act-kids',
          startsAt: new Date('2026-11-18T13:00:00.000Z'),
          endsAt: new Date('2026-11-18T15:00:00.000Z'),
          capacity: 5,
          isManual: true,
          isCancelled: false,
        },
        {
          id: 'manual-beyond-window',
          activityId: 'act-kids',
          startsAt: new Date('2026-12-09T13:00:00.000Z'),
          endsAt: new Date('2026-12-09T15:00:00.000Z'),
          capacity: 5,
          isManual: true,
          isCancelled: false,
        },
      ],
      bookingsBySessionId: {},
    });
    expect(scheduleRes.ok).toBe(true);
    if (scheduleRes.ok)
      expect(scheduleRes.value.map((s) => s.startsAt.toISOString())).toEqual([
        '2026-11-11T13:00:00.000Z',
        '2026-11-18T13:00:00.000Z',
        '2026-12-09T13:00:00.000Z',
      ]);
  });
});
