// src/core/use-cases/__tests__/milestone4.test.ts
import { describe, expect, it } from 'vitest';
import { ERROR_CODES, VOUCHER_STATUSES } from '../../../config/constants';
import { failAndLog } from '../../../lib/logger';
import { ok } from '../../../lib/result';
import {
  calculateVoucherApplication,
  verifyVoucherIsUsable,
  type RescheduleVoucherSnapshot,
} from '../../domain/voucher-engine';
import type {
  AttendeeCancellationContext,
  VoucherNotificationPayload,
  VoucherRepositoryPort,
} from '../../ports/voucher.port';
import { VoucherLifecycleUseCase } from '../voucher-lifecycle.use-case';
function createInMemoryVoucherRepo(initialCtx: AttendeeCancellationContext) {
  const vouchersByCode = new Map<string, RescheduleVoucherSnapshot>();
  const sentNotifications: VoucherNotificationPayload[] = [];
  const repo: VoucherRepositoryPort = {
    async getBookingContextForAttendeeCancellation() {
      return ok(initialCtx);
    },
    async cancelBookingWithoutVoucherAtomically() {
      return ok(undefined);
    },
    async cancelBookingAndCreateVoucherAtomically(input) {
      const created: RescheduleVoucherSnapshot = {
        id: 'vouch-1',
        organizationId: input.organizationId,
        originActivityId: input.originActivityId,
        originBookingId: input.bookingId,
        code: input.code,
        initialValueCents: input.initialValueCents,
        status: VOUCHER_STATUSES.ACTIVE,
        lockedUntil: null,
        expiresAt: input.expiresAt,
      };
      vouchersByCode.set(created.code, created);
      return ok(created);
    },
    async lockAndApplyVoucherForBookingAtomically(params) {
      const existing = vouchersByCode.get(params.code);
      if (!existing)
        return failAndLog({
          code: ERROR_CODES.VOUCHER_INVALID_OR_EXPIRED,
          module: 'InMemoryVoucherRepo',
          fn: 'lockAndApplyVoucherForBookingAtomically',
          cause: 'Code inconnu sur le serveur',
          received: params.code,
          expected: 'code existant',
        });
      const usableRes = verifyVoucherIsUsable(
        existing,
        params.organizationId,
        params.now,
      );
      if (!usableRes.ok) return usableRes;
      const pricingRes = calculateVoucherApplication(
        existing,
        params.targetActivityPriceCents,
      );
      if (!pricingRes.ok) return pricingRes;
      const updated: RescheduleVoucherSnapshot = {
        ...existing,
        status: pricingRes.value.nextVoucherStatus,
        lockedUntil: pricingRes.value.requiresOnlinePayment
          ? new Date(params.now.getTime() + params.lockDurationMs)
          : null,
      };
      vouchersByCode.set(updated.code, updated);
      return ok({ voucher: updated, pricing: pricingRes.value });
    },
    async redeemVoucherForExternalBenefitAtomically(params) {
      const existing = vouchersByCode.get(params.code);
      if (!existing)
        return failAndLog({
          code: ERROR_CODES.VOUCHER_INVALID_OR_EXPIRED,
          module: 'InMemoryVoucherRepo',
          fn: 'redeemVoucherForExternalBenefitAtomically',
          cause: 'Code inconnu',
          received: params.code,
          expected: 'code existant',
        });
      const usableRes = verifyVoucherIsUsable(
        existing,
        params.organizationId,
        params.now,
      );
      if (!usableRes.ok) return usableRes;
      const updated: RescheduleVoucherSnapshot = {
        ...existing,
        status: VOUCHER_STATUSES.USED_FOR_EXTERNAL_BENEFIT,
        lockedUntil: null,
      };
      vouchersByCode.set(updated.code, updated);
      return ok(updated);
    },
  };
  return { repo, vouchersByCode, sentNotifications };
}
describe('Jalon 4 — Jeton serveur Code de report, Délai 72h, Différence de prix & Cours en ligne', () => {
  const SESSION_START = new Date('2026-11-15T14:00:00.000Z');
  const BASE_CTX: AttendeeCancellationContext = {
    bookingId: 'book-adult-30',
    organizationId: 'org-studio-360',
    activityId: 'act-adult-30',
    attendeeEmail: 'marie@example.com',
    attendeeFirstName: 'Marie',
    sessionStartsAt: SESSION_START,
    amountPaidCents: 3000,
    noticeHoursForVoucher: 72,
    voucherValidityMonths: 3,
    allowExternalBenefitExchange: true,
  };
  it('émet un code de report de 30 € valable 3 mois si le client prévient au moins 72h à l’avance (ex: 96h avant)', async () => {
    const cancelTime = new Date('2026-11-11T14:00:00.000Z');
    const { repo, sentNotifications } = createInMemoryVoucherRepo(BASE_CTX);
    const useCase = new VoucherLifecycleUseCase({
      voucherRepo: repo,
      sendVoucherEmail: async (p) => {
        sentNotifications.push(p);
        return ok(undefined);
      },
      nowProvider: () => cancelTime,
    });
    const res = await useCase.cancelByAttendee({
      organizationId: 'org-studio-360',
      bookingId: 'book-adult-30',
      baseBookingUrl: 'https://studio360.be/book',
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.voucherIssued).toBe(true);
      expect(res.value.voucher?.initialValueCents).toBe(3000);
      expect(res.value.voucher?.code).toMatch(/^RPT-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      expect(res.value.qrBookingUrl).toContain('?voucher=RPT-');
      expect(sentNotifications).toHaveLength(1);
    }
  });
  it('annule la réservation mais N’ÉMET PAS de code si le client prévient moins de 72h avant (ex: 24h avant)', async () => {
    const lateCancelTime = new Date('2026-11-14T14:00:00.000Z');
    const { repo } = createInMemoryVoucherRepo(BASE_CTX);
    const useCase = new VoucherLifecycleUseCase({
      voucherRepo: repo,
      sendVoucherEmail: async () => ok(undefined),
      nowProvider: () => lateCancelTime,
    });
    const res = await useCase.cancelByAttendee({
      organizationId: 'org-studio-360',
      bookingId: 'book-adult-30',
      baseBookingUrl: 'https://studio360.be/book',
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.bookingCancelled).toBe(true);
      expect(res.value.voucherIssued).toBe(false);
      expect(res.value.voucher).toBeNull();
    }
  });
  it('calcule 0 € à payer sur une activité moins chère (20 €) ou calcule 10 € de supplément sur une activité plus chère (40 €)', async () => {
    const now = new Date('2026-11-10T10:00:00.000Z');
    const { repo } = createInMemoryVoucherRepo(BASE_CTX);
    const useCase = new VoucherLifecycleUseCase({
      voucherRepo: repo,
      sendVoucherEmail: async () => ok(undefined),
      nowProvider: () => now,
    });
    const cancelRes = await useCase.cancelByAttendee({
      organizationId: 'org-studio-360',
      bookingId: 'book-adult-30',
      baseBookingUrl: 'https://studio360.be/book',
    });
    expect(cancelRes.ok).toBe(true);
    if (!cancelRes.ok || !cancelRes.value.voucher) return;
    const code = cancelRes.value.voucher.code;
    const calcMoreExpensive = calculateVoucherApplication(
      cancelRes.value.voucher,
      4000,
    );
    expect(calcMoreExpensive.ok).toBe(true);
    if (calcMoreExpensive.ok) {
      expect(calcMoreExpensive.value.appliedDiscountCents).toBe(3000);
      expect(calcMoreExpensive.value.remainingToPayCents).toBe(1000);
      expect(calcMoreExpensive.value.requiresOnlinePayment).toBe(true);
      expect(calcMoreExpensive.value.nextVoucherStatus).toBe(
        VOUCHER_STATUSES.LOCKED_PENDING_PAYMENT,
      );
    }
    const applyCheaperRes = await useCase.applyVoucherToBooking({
      organizationId: 'org-studio-360',
      code,
      targetActivityPriceCents: 2000,
    });
    expect(applyCheaperRes.ok).toBe(true);
    if (applyCheaperRes.ok) {
      expect(applyCheaperRes.value.pricing.remainingToPayCents).toBe(0);
      expect(applyCheaperRes.value.pricing.forfeitedRemainderCents).toBe(1000);
      expect(applyCheaperRes.value.pricing.requiresOnlinePayment).toBe(false);
      expect(applyCheaperRes.value.voucher.status).toBe(
        VOUCHER_STATUSES.USED_FOR_BOOKING,
      );
    }
  });
  it('empêche strictement d’utiliser un code pour réserver une séance s’il a déjà servi à débloquer le cours en ligne', async () => {
    const now = new Date('2026-11-10T10:00:00.000Z');
    const { repo } = createInMemoryVoucherRepo(BASE_CTX);
    const useCase = new VoucherLifecycleUseCase({
      voucherRepo: repo,
      sendVoucherEmail: async () => ok(undefined),
      nowProvider: () => now,
    });
    const cancelRes = await useCase.cancelByAttendee({
      organizationId: 'org-studio-360',
      bookingId: 'book-adult-30',
      baseBookingUrl: 'https://studio360.be/book',
    });
    if (!cancelRes.ok || !cancelRes.value.voucher) return;
    const code = cancelRes.value.voucher.code;
    const onlineCourseRes = await useCase.redeemForOnlineCourse({
      organizationId: 'org-studio-360',
      code,
    });
    expect(onlineCourseRes.ok).toBe(true);
    if (onlineCourseRes.ok)
      expect(onlineCourseRes.value.status).toBe(
        VOUCHER_STATUSES.USED_FOR_EXTERNAL_BENEFIT,
      );
    const fraudAttempt = await useCase.applyVoucherToBooking({
      organizationId: 'org-studio-360',
      code,
      targetActivityPriceCents: 3000,
    });
    expect(fraudAttempt.ok).toBe(false);
    if (!fraudAttempt.ok)
      expect(fraudAttempt.error.code).toBe(
        ERROR_CODES.VOUCHER_INVALID_OR_EXPIRED,
      );
  });
});
