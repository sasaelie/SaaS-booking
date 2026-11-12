import type { Result } from '../../lib/result';
export interface GdprBookingSummary {
  readonly bookingId: string;
  readonly organizationId: string;
  readonly amountPaidCents: number;
  readonly createdAt: Date;
  readonly paidAt: Date | null;
  readonly proofIsAccounting: boolean;
}
export interface GdprRepositoryPort {
  purgeClosedOperationalData?(
    now: Date,
    dryRun: boolean,
  ): Promise<Result<{ readonly anonymizedCount: number }>>;
  anonymizeUnpaidBookingsOlderThanAtomically(
    cutoffDate: Date,
  ): Promise<Result<{ readonly anonymizedCount: number }>>;
  getBookingForPrivacyRequest(
    organizationId: string,
    bookingId: string,
  ): Promise<Result<GdprBookingSummary>>;
  scrubNonAccountingDataAtomically(
    organizationId: string,
    bookingId: string,
  ): Promise<Result<void>>;
  fullyAnonymizeBookingAtomically(organizationId: string, bookingId: string): Promise<Result<void>>;
}
