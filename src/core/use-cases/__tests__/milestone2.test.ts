// src/core/use-cases/__tests__/milestone2.test.ts
import { describe, expect, it } from 'vitest';
import {
  AUDIENCE_POLICIES,
  BOOKING_STATUSES,
  ERROR_CODES,
  PAYMENT_MODES,
} from '../../../config/constants';
import { ok } from '../../../lib/result';
import { calculateSeatAvailability } from '../../domain/seat-calculator';
import { generateDynamicTerms } from '../../domain/terms-generator';
import type {
  ActivityRepositoryPort,
  ActivityWithScheduleConfig,
  BookingConfirmationNotificationPayload,
  NotificationPort,
} from '../../ports/booking-ports';
import type { SessionRepositoryPort } from '../../ports/session-repository.port';
import { CreateBookingUseCase } from '../create-booking.use-case';
const NOW = new Date('2026-11-09T09:00:00.000Z');
function buildFakeActivity(
  overrides: Partial<ActivityWithScheduleConfig> = {},
): ActivityWithScheduleConfig {
  return {
    id: 'act-couture-kids',
    organizationId: 'org-studio-360',
    organizationName: 'ASBL Studio Créatif 360',
    timezone: 'Europe/Brussels',
    name: 'Cours de couture débutants — Enfants',
    priceCents: 2000,
    currency: 'EUR',
    audiencePolicy: AUDIENCE_POLICIES.MINORS_ONLY,
    requirePhone: true,
    paymentMode: PAYMENT_MODES.NONE,
    bookingWindowWeeks: 4,
    noticeHoursForVoucher: 72,
    voucherValidityMonths: 3,
    allowExternalBenefitExchange: true,
    weeklySlots: [
      {
        id: 'slot-wed',
        activityId: 'act-couture-kids',
        dayOfWeek: 3,
        startTimeLocal: '14:00',
        endTimeLocal: '16:00',
        capacity: 5,
      },
    ],
    pausePeriods: [],
    manualSessions: [],
    ...overrides,
  };
}
function createFakeDeps(activity: ActivityWithScheduleConfig) {
  const sentEmails: BookingConfirmationNotificationPayload[] = [];
  const activityRepo: ActivityRepositoryPort = {
    async getActivityWithScheduleConfig() {
      return ok(activity);
    },
  };
  const sessionRepo: SessionRepositoryPort = {
    async reserveSeatAtomically(input) {
      const availability = calculateSeatAvailability(
        input.defaultCapacity,
        [
          {
            id: 'book-1',
            sessionId: 'sess-1',
            status: input.booking.status,
            lockedUntil: input.booking.lockedUntil,
          },
        ],
        input.now,
      );
      if (!availability.ok) return availability;
      return ok({
        bookingId: 'book-1',
        session: {
          id: 'sess-1',
          activityId: input.activityId,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          capacity: input.defaultCapacity,
          isManual: false,
          isCancelled: false,
        },
        availabilityAfterBooking: availability.value,
      });
    },
  };
  const notificationPort: NotificationPort = {
    async sendBookingConfirmation(payload) {
      sentEmails.push(payload);
      return ok({ messageId: 'msg-123' });
    },
  };
  return { activityRepo, sessionRepo, notificationPort, sentEmails };
}
describe('Jalon 2 — CGV dynamiques belges, Protection Mineurs & Réservation mode NONE', () => {
  it('génère des CGV dynamiques incluant l’art. VI.53, 12° CDE belge et le délai de 72h', () => {
    const activity = buildFakeActivity();
    const terms = generateDynamicTerms({
      organizationName: activity.organizationName,
      activityName: activity.name,
      priceCents: activity.priceCents,
      currency: activity.currency,
      audiencePolicy: activity.audiencePolicy,
      paymentMode: activity.paymentMode,
      noticeHoursForVoucher: activity.noticeHoursForVoucher,
      voucherValidityMonths: activity.voucherValidityMonths,
      allowExternalBenefitExchange: activity.allowExternalBenefitExchange,
    });
    expect(terms.fullText).toContain(
      'VI.53, 12° du Code de droit économique belge',
    );
    expect(terms.fullText).toContain('72 heures avant le début de la séance');
    expect(terms.fullText).toContain('20,00 EUR');
    expect(terms.versionHash).toMatch(/^terms-v2-[0-9a-f]{8}$/);
  });
  it('bloque la réservation (MINOR_EMERGENCY_PHONE_REQUIRED) sur une activité MINORS_ONLY si le téléphone est omis', async () => {
    const activity = buildFakeActivity({
      audiencePolicy: AUDIENCE_POLICIES.MINORS_ONLY,
    });
    const deps = createFakeDeps(activity);
    const terms = generateDynamicTerms({
      ...activity,
      organizationName: activity.organizationName,
      activityName: activity.name,
    });
    const useCase = new CreateBookingUseCase({
      ...deps,
      nowProvider: () => NOW,
    });
    const res = await useCase.execute({
      organizationId: activity.organizationId,
      activityId: activity.id,
      startsAtIso: '2026-11-11T13:00:00.000Z',
      idempotencyKey: 'idem-kids-no-phone',
      firstName: 'Lucas',
      lastName: 'Dupont',
      email: 'parent@example.com',
      phone: '',
      acceptedTerms: true,
      acceptedAgeAttestation: true,
      acceptedTermsVersionHash: terms.versionHash,
    });
    expect(res.ok).toBe(false);
    if (!res.ok)
      expect(res.error.code).toBe(ERROR_CODES.MINOR_EMERGENCY_PHONE_REQUIRED);
  });
  it('confirme immédiatement la place (4 / 5) et envoie l’e-mail en mode NONE lorsque le téléphone d’urgence et les CGV sont valides', async () => {
    const activity = buildFakeActivity();
    const deps = createFakeDeps(activity);
    const terms = generateDynamicTerms({
      ...activity,
      organizationName: activity.organizationName,
      activityName: activity.name,
    });
    const useCase = new CreateBookingUseCase({
      ...deps,
      nowProvider: () => NOW,
    });
    const res = await useCase.execute({
      organizationId: activity.organizationId,
      activityId: activity.id,
      startsAtIso: '2026-11-11T13:00:00.000Z',
      idempotencyKey: 'idem-kids-valid-001',
      firstName: 'Lucas',
      lastName: 'Dupont',
      email: 'parent@example.com',
      phone: '+32 470 12 34 56',
      marketingOptIn: true,
      acceptedTerms: true,
      acceptedAgeAttestation: true,
      acceptedTermsVersionHash: terms.versionHash,
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.status).toBe(BOOKING_STATUSES.CONFIRMED);
      expect(res.value.lockedUntil).toBeNull();
      expect(res.value.availabilityAfterBooking.displayLabel).toBe('4 / 5');
      expect(deps.sentEmails).toHaveLength(1);
    }
  });
});
