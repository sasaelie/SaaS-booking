// src/core/use-cases/__tests__/milestone6.test.ts
import { describe, expect, it } from 'vitest';
import { ERROR_CODES } from '../../../config/constants';
import { ok } from '../../../lib/result';
import {
  signSelfCancelToken,
  verifySelfCancelToken,
} from '../../domain/self-service-token';
import {
  GdprRetentionUseCase,
  type GdprBookingSummary,
  type GdprRepositoryPort,
} from '../gdpr-retention.use-case';
describe('Jalon 6 — Lien d’annulation autonome signé HMAC & Automatisation RGPD (12 mois / 7 ans)', () => {
  const SECRET = 'super_secret_hmac_key_studio_360_liege';
  const NOW = new Date('2026-11-09T10:00:00.000Z');
  it('signe et vérifie un jeton d’annulation autonome, et rejette toute altération avec UNAUTHORIZED', async () => {
    const expUnixSeconds = Math.floor(NOW.getTime() / 1000) + 3600;
    const tokenRes = await signSelfCancelToken(
      {
        organizationId: 'org-studio-360',
        bookingId: 'book-999',
        attendeeEmail: 'elie@example.com',
        expUnixSeconds,
      },
      SECRET,
    );
    expect(tokenRes.ok).toBe(true);
    if (!tokenRes.ok) return;
    const verifiedRes = await verifySelfCancelToken(
      tokenRes.value,
      SECRET,
      NOW,
    );
    expect(verifiedRes.ok).toBe(true);
    if (verifiedRes.ok) expect(verifiedRes.value.bookingId).toBe('book-999');
    const tamperedToken = `${tokenRes.value.slice(0, -4)}AAAA`;
    const tamperedRes = await verifySelfCancelToken(tamperedToken, SECRET, NOW);
    expect(tamperedRes.ok).toBe(false);
    if (!tamperedRes.ok)
      expect(tamperedRes.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
  });
  it('anonymise les réservations non payées à 12 mois et protège les preuves comptables payées pendant 7 ans (Droit belge)', async () => {
    let scrubbedBookingId: string | null = null;
    let fullyAnonymizedBookingId: string | null = null;
    const bookingsDb: Record<string, GdprBookingSummary> = {
      'paid-recent': {
        bookingId: 'paid-recent',
        organizationId: 'org-studio-360',
        amountPaidCents: 3000,
        createdAt: new Date('2026-01-15T10:00:00.000Z'),
      },
      'paid-over-7-years': {
        bookingId: 'paid-over-7-years',
        organizationId: 'org-studio-360',
        amountPaidCents: 3000,
        createdAt: new Date('2018-05-01T10:00:00.000Z'),
      },
    };
    const gdprRepo: GdprRepositoryPort = {
      async anonymizeUnpaidBookingsOlderThanAtomically() {
        return ok({ anonymizedCount: 14 });
      },
      async getBookingForPrivacyRequest(_, bookingId) {
        const found = bookingsDb[bookingId];
        if (!found) throw new Error('Not found');
        return ok(found);
      },
      async scrubNonAccountingDataAtomically(_, bookingId) {
        scrubbedBookingId = bookingId;
        return ok(undefined);
      },
      async fullyAnonymizeBookingAtomically(_, bookingId) {
        fullyAnonymizedBookingId = bookingId;
        return ok(undefined);
      },
    };
    const useCase = new GdprRetentionUseCase({
      gdprRepo,
      nowProvider: () => NOW,
    });
    const batchRes = await useCase.runScheduledUnpaidAnonymization();
    expect(batchRes.ok).toBe(true);
    if (batchRes.ok) {
      expect(batchRes.value.anonymizedCount).toBe(14);
      expect(batchRes.value.cutoffDate.toISOString()).toBe(
        '2025-11-09T10:00:00.000Z',
      );
    }
    const recentPaidRes = await useCase.handleAttendeePrivacyErasureRequest({
      organizationId: 'org-studio-360',
      bookingId: 'paid-recent',
    });
    expect(recentPaidRes.ok).toBe(true);
    if (recentPaidRes.ok)
      expect(recentPaidRes.value.status).toBe(
        'NON_ACCOUNTING_DATA_SCRUBBED_7Y_LEGAL_KEEP',
      );
    expect(scrubbedBookingId).toBe('paid-recent');
    const oldPaidRes = await useCase.handleAttendeePrivacyErasureRequest({
      organizationId: 'org-studio-360',
      bookingId: 'paid-over-7-years',
    });
    expect(oldPaidRes.ok).toBe(true);
    if (oldPaidRes.ok) expect(oldPaidRes.value.status).toBe('FULLY_ANONYMIZED');
    expect(fullyAnonymizedBookingId).toBe('paid-over-7-years');
  });
});
