// src/core/use-cases/gdpr-retention.use-case.ts
import { DATA_RETENTION } from '../../config/constants';
import { ok, type AppError, type Result } from '../../lib/result';
export interface GdprBookingSummary {
  readonly bookingId: string;
  readonly organizationId: string;
  readonly amountPaidCents: number;
  readonly createdAt: Date;
}
export interface GdprRepositoryPort {
  anonymizeUnpaidBookingsOlderThanAtomically(
    cutoffDate: Date,
  ): Promise<Result<{ readonly anonymizedCount: number }, AppError>>;
  getBookingForPrivacyRequest(
    organizationId: string,
    bookingId: string,
  ): Promise<Result<GdprBookingSummary, AppError>>;
  scrubNonAccountingDataAtomically(
    organizationId: string,
    bookingId: string,
  ): Promise<Result<void, AppError>>;
  fullyAnonymizeBookingAtomically(
    organizationId: string,
    bookingId: string,
  ): Promise<Result<void, AppError>>;
}
export type PrivacyErasureOutcome =
  | {
      readonly status: 'NON_ACCOUNTING_DATA_SCRUBBED_7Y_LEGAL_KEEP';
      readonly bookingId: string;
      readonly accountingArchiveUntil: Date;
    }
  | { readonly status: 'FULLY_ANONYMIZED'; readonly bookingId: string };
export interface GdprRetentionDeps {
  readonly gdprRepo: GdprRepositoryPort;
  readonly nowProvider?: () => Date;
}
function subtractMonthsUtc(date: Date, months: number): Date {
  const copy = new Date(date.getTime());
  copy.setUTCMonth(copy.getUTCMonth() - months);
  return copy;
}
function addYearsUtc(date: Date, years: number): Date {
  const copy = new Date(date.getTime());
  copy.setUTCFullYear(copy.getUTCFullYear() + years);
  return copy;
}
export class GdprRetentionUseCase {
  public constructor(private readonly deps: GdprRetentionDeps) {}
  public async runScheduledUnpaidAnonymization(): Promise<
    Result<
      { readonly cutoffDate: Date; readonly anonymizedCount: number },
      AppError
    >
  > {
    const now = this.deps.nowProvider ? this.deps.nowProvider() : new Date();
    const cutoffDate = subtractMonthsUtc(
      now,
      DATA_RETENTION.UNPAID_BOOKING_ANONYMIZE_MONTHS,
    );
    const res =
      await this.deps.gdprRepo.anonymizeUnpaidBookingsOlderThanAtomically(
        cutoffDate,
      );
    if (!res.ok) return res;
    return ok({ cutoffDate, anonymizedCount: res.value.anonymizedCount });
  }
  public async handleAttendeePrivacyErasureRequest(params: {
    readonly organizationId: string;
    readonly bookingId: string;
  }): Promise<Result<PrivacyErasureOutcome, AppError>> {
    const now = this.deps.nowProvider ? this.deps.nowProvider() : new Date();
    const bookingRes = await this.deps.gdprRepo.getBookingForPrivacyRequest(
      params.organizationId,
      params.bookingId,
    );
    if (!bookingRes.ok) return bookingRes;
    const booking = bookingRes.value;
    const accountingArchiveUntil = addYearsUtc(
      booking.createdAt,
      DATA_RETENTION.PAID_BOOKING_ARCHIVE_YEARS,
    );
    const mustKeepForBelgianAccounting =
      booking.amountPaidCents > 0 &&
      now.getTime() < accountingArchiveUntil.getTime();
    if (mustKeepForBelgianAccounting) {
      const scrubRes =
        await this.deps.gdprRepo.scrubNonAccountingDataAtomically(
          params.organizationId,
          params.bookingId,
        );
      if (!scrubRes.ok) return scrubRes;
      return ok({
        status: 'NON_ACCOUNTING_DATA_SCRUBBED_7Y_LEGAL_KEEP',
        bookingId: booking.bookingId,
        accountingArchiveUntil,
      });
    }
    const anonRes = await this.deps.gdprRepo.fullyAnonymizeBookingAtomically(
      params.organizationId,
      params.bookingId,
    );
    if (!anonRes.ok) return anonRes;
    return ok({ status: 'FULLY_ANONYMIZED', bookingId: booking.bookingId });
  }
}
