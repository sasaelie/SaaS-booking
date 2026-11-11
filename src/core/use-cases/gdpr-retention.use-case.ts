import { COMMERCIAL } from '../../config/commercial';
import { TIME } from '../../config/constants';
import { guardUseCase } from '../../lib/guard-use-case';
import { accountingArchiveUntil } from '../domain/accounting-retention';
// src/core/use-cases/gdpr-retention.use-case.ts
import { DATA_RETENTION } from '../../config/constants';
import { ok, type AppError, type Result } from '../../lib/result';
import type { GdprRepositoryPort } from '../ports/gdpr.port';
import type { AuthorizationPort } from '../ports/authorization.port';
import { addMonthsClamped } from '../domain/date-math';
export type PrivacyErasureOutcome =
  | {
      readonly status: 'ACCOUNTING_DATA_RETAINED';
      readonly bookingId: string;
      readonly accountingArchiveUntil: Date;
    }
  | { readonly status: 'FULLY_ANONYMIZED'; readonly bookingId: string };
export interface GdprRetentionDeps {
  readonly gdprRepo: GdprRepositoryPort;
  readonly authorization: AuthorizationPort;
  readonly nowProvider?: () => Date;
  readonly operationalPurgeEnabled?: boolean;
}
function subtractMonthsUtc(date: Date, months: number): Date {
  return addMonthsClamped(date, -months);
}
export class GdprRetentionUseCase {
  public constructor(private readonly deps: GdprRetentionDeps) {}
  public async runScheduledUnpaidAnonymization(): Promise<
    Result<{ readonly cutoffDate: Date; readonly anonymizedCount: number }, AppError>
  > {
    return guardUseCase(
      'gdpr-retention.use-case.ts',
      'runScheduledUnpaidAnonymization',
      async () => {
        const now = this.deps.nowProvider ? this.deps.nowProvider() : new Date();
        const cutoffDate = this.deps.gdprRepo.purgeClosedOperationalData
          ? new Date(now.getTime() - COMMERCIAL.OPERATIONAL_RETENTION_DAYS * TIME.DAY_MS)
          : subtractMonthsUtc(now, DATA_RETENTION.UNPAID_BOOKING_ANONYMIZE_MONTHS);
        const res = this.deps.gdprRepo.purgeClosedOperationalData
          ? await this.deps.gdprRepo.purgeClosedOperationalData(
              now,
              !this.deps.operationalPurgeEnabled,
            )
          : await this.deps.gdprRepo.anonymizeUnpaidBookingsOlderThanAtomically(cutoffDate);
        if (!res.ok) return res;
        return ok({ cutoffDate, anonymizedCount: res.value.anonymizedCount });
      },
    );
  }
  public async handleAttendeePrivacyErasureRequest(params: {
    readonly organizationId: string;
    readonly bookingId: string;
  }): Promise<Result<PrivacyErasureOutcome, AppError>> {
    return guardUseCase(
      'gdpr-retention.use-case.ts',
      'handleAttendeePrivacyErasureRequest',
      async () => {
        const auth = await this.deps.authorization.authorizeOrganizationAdmin(
          params.organizationId,
        );
        if (!auth.ok) return auth;
        const now = this.deps.nowProvider ? this.deps.nowProvider() : new Date();
        const bookingRes = await this.deps.gdprRepo.getBookingForPrivacyRequest(
          params.organizationId,
          params.bookingId,
        );
        if (!bookingRes.ok) return bookingRes;
        const booking = bookingRes.value;
        const archiveUntil = accountingArchiveUntil(booking.paidAt, booking.createdAt);
        const mustKeepForBelgianAccounting =
          booking.amountPaidCents > 0 && now.getTime() < archiveUntil.getTime();
        if (mustKeepForBelgianAccounting) {
          return retainAccountingData(this.deps.gdprRepo, params, booking.bookingId, archiveUntil);
        }
        const anonRes = await this.deps.gdprRepo.fullyAnonymizeBookingAtomically(
          params.organizationId,
          params.bookingId,
        );
        if (!anonRes.ok) return anonRes;
        return ok({ status: 'FULLY_ANONYMIZED', bookingId: booking.bookingId });
      },
    );
  }
}

async function retainAccountingData(
  repository: GdprRepositoryPort,
  params: { readonly organizationId: string; readonly bookingId: string },
  bookingId: string,
  archiveUntil: Date,
): Promise<Result<PrivacyErasureOutcome>> {
  const result = await repository.scrubNonAccountingDataAtomically(
    params.organizationId,
    params.bookingId,
  );
  return result.ok
    ? ok({ status: 'ACCOUNTING_DATA_RETAINED', bookingId, accountingArchiveUntil: archiveUntil })
    : result;
}
