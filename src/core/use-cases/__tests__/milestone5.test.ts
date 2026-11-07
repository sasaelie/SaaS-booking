// src/core/use-cases/__tests__/milestone5.test.ts
import { describe, expect, it } from 'vitest';
import {
  BOOKING_STATUSES,
  ERROR_CODES,
  PAYMENT_MODES,
} from '../../../config/constants';
import { ok } from '../../../lib/result';
import type {
  AffectedBookingForClosure,
  BankTransferBookingRecord,
  BankTransferRepositoryPort,
  PrivateProofStoragePort,
  SessionClosureRepositoryPort,
} from '../../ports/bank-and-closure.port';
import type { PaymentGatewayPort } from '../../ports/payment-gateway.port';
import { BankTransferWorkflowUseCase } from '../bank-transfer-workflow.use-case';
import { CloseSessionWithProtectionUseCase } from '../close-session-with-protection.use-case';
const VALID_PNG_BYTES = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
]);
const FAKE_PDF_RENAMED_AS_PNG = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);
describe('Jalon 5 — Sécurité binaire Virement + Purge RGPD immédiate & Protection Fermeture de Séance', () => {
  it('rejette immédiatement un fichier PDF ou exécutable déguisé en image grâce aux Magic Bytes', async () => {
    const storedFiles = new Set<string>();
    const storagePort: PrivateProofStoragePort = {
      async uploadPrivateProof({ storageKey }) {
        storedFiles.add(storageKey);
        return ok({ storageKey });
      },
      async getTemporaryAdminViewUrl() {
        return ok({ presignedUrl: 'https://private.eu/view' });
      },
      async deleteProofImmediately(storageKey) {
        storedFiles.delete(storageKey);
        return ok({ deleted: true });
      },
    };
    const bankRepo: BankTransferRepositoryPort = {
      async attachProofToBookingAtomically() {
        return ok(undefined);
      },
      async getBankTransferBookingForReview() {
        return ok({} as BankTransferBookingRecord);
      },
      async finalizeAdminBankDecisionAtomically() {
        return ok(undefined);
      },
    };
    const useCase = new BankTransferWorkflowUseCase({ storagePort, bankRepo });
    const res = await useCase.submitProof({
      organizationId: 'org-studio-360',
      bookingId: 'book-bank-1',
      fileBytes: FAKE_PDF_RENAMED_AS_PNG,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe(ERROR_CODES.INVALID_PROOF_FILE);
    expect(storedFiles.size).toBe(0);
  });
  it('accepte un vrai PNG et supprime définitivement le fichier du serveur dès que l’admin confirme le virement (RGPD)', async () => {
    const storedFiles = new Set<string>();
    let currentBooking: BankTransferBookingRecord = {
      bookingId: 'book-bank-1',
      organizationId: 'org-studio-360',
      status: BOOKING_STATUSES.PENDING_PAYMENT,
      proofStorageKey: null,
      autoDeleteBankProof: true,
      unitPriceCents: 3000,
      attendeeEmail: 'claire@example.com',
      attendeeFirstName: 'Claire',
    };
    const storagePort: PrivateProofStoragePort = {
      async uploadPrivateProof({ storageKey }) {
        storedFiles.add(storageKey);
        return ok({ storageKey });
      },
      async getTemporaryAdminViewUrl() {
        return ok({ presignedUrl: 'https://private.eu/view' });
      },
      async deleteProofImmediately(storageKey) {
        storedFiles.delete(storageKey);
        return ok({ deleted: true });
      },
    };
    const bankRepo: BankTransferRepositoryPort = {
      async attachProofToBookingAtomically({ proofStorageKey }) {
        currentBooking = {
          ...currentBooking,
          status: BOOKING_STATUSES.PROOF_SUBMITTED,
          proofStorageKey,
        };
        return ok(undefined);
      },
      async getBankTransferBookingForReview() {
        return ok(currentBooking);
      },
      async finalizeAdminBankDecisionAtomically({
        nextStatus,
        clearProofStorageKey,
      }) {
        currentBooking = {
          ...currentBooking,
          status: nextStatus,
          proofStorageKey: clearProofStorageKey
            ? null
            : currentBooking.proofStorageKey,
        };
        return ok(undefined);
      },
    };
    const useCase = new BankTransferWorkflowUseCase({
      storagePort,
      bankRepo,
      nowProvider: () => new Date('2026-11-10T12:00:00.000Z'),
    });
    const submitRes = await useCase.submitProof({
      organizationId: 'org-studio-360',
      bookingId: 'book-bank-1',
      fileBytes: VALID_PNG_BYTES,
    });
    expect(submitRes.ok).toBe(true);
    expect(storedFiles.size).toBe(1);
    const decisionRes = await useCase.reviewByAdmin({
      organizationId: 'org-studio-360',
      bookingId: 'book-bank-1',
      decision: 'APPROVE',
    });
    expect(decisionRes).toEqual(
      ok({
        bookingId: 'book-bank-1',
        finalStatus: BOOKING_STATUSES.CONFIRMED,
        proofImagePurged: true,
      }),
    );
    expect(storedFiles.size).toBe(0);
    expect(currentBooking.proofStorageKey).toBeNull();
  });
  it('bloque la fermeture d’une séance occupée sans confirmation explicite, puis rembourse automatiquement Stripe et liste les virements à rembourser sous 30 jours après confirmation', async () => {
    const activeBookings: AffectedBookingForClosure[] = [
      {
        bookingId: 'b-stripe-1',
        attendeeEmail: 'alice@example.com',
        attendeeFirstName: 'Alice',
        paymentMode: PAYMENT_MODES.STRIPE,
        paymentReference: 'pi_stripe_100',
        amountPaidCents: 3000,
        status: BOOKING_STATUSES.CONFIRMED,
      },
      {
        bookingId: 'b-bank-2',
        attendeeEmail: 'thomas@example.com',
        attendeeFirstName: 'Thomas',
        paymentMode: PAYMENT_MODES.BANK_TRANSFER,
        paymentReference: '+++123/4567/89002+++',
        amountPaidCents: 3000,
        status: BOOKING_STATUSES.CONFIRMED,
      },
    ];
    const closureRepo: SessionClosureRepositoryPort = {
      async listActiveBookingsForSession() {
        return ok(activeBookings);
      },
      async markSessionAndBookingsCancelledByOrganizerAtomically() {
        return ok(undefined);
      },
    };
    const stripeGateway: PaymentGatewayPort = {
      mode: PAYMENT_MODES.STRIPE,
      async initiatePayment() {
        throw new Error('Not used');
      },
      async verifyWebhookAndParse() {
        throw new Error('Not used');
      },
      async refundPayment({ paymentReference }) {
        return ok({ refundId: `re_for_${paymentReference}` });
      },
    };
    const useCase = new CloseSessionWithProtectionUseCase({
      closureRepo,
      stripeGateway,
      notifySessionCancelledByOrganizer: async () => ok(undefined),
    });
    const firstTry = await useCase.execute({
      organizationId: 'org-studio-360',
      sessionId: 'sess-occupied',
      confirmCancelExistingBookings: false,
      reason: 'Machine à coudre en maintenance',
    });
    expect(firstTry.ok).toBe(true);
    if (firstTry.ok) {
      expect(firstTry.value.status).toBe('CONFIRMATION_REQUIRED');
      if (firstTry.value.status === 'CONFIRMATION_REQUIRED')
        expect(firstTry.value.affectedBookingsCount).toBe(2);
    }
    const confirmedClose = await useCase.execute({
      organizationId: 'org-studio-360',
      sessionId: 'sess-occupied',
      confirmCancelExistingBookings: true,
      reason: 'Machine à coudre en maintenance',
    });
    expect(confirmedClose).toEqual(
      ok({
        status: 'CLOSED_AND_REFUNDED',
        cancelledBookingsCount: 2,
        stripeAutoRefundIds: ['re_for_pi_stripe_100'],
        manualBankRefundsRequired: [
          {
            bookingId: 'b-bank-2',
            attendeeEmail: 'thomas@example.com',
            amountCents: 3000,
            deadlineDays: 30,
          },
        ],
      }),
    );
  });
});
