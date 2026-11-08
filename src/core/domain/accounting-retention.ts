import { DATA_RETENTION } from '../../config/constants';
export function accountingArchiveUntil(paidAt: Date | null, createdAt: Date): Date {
  const origin = paidAt ?? createdAt;
  return new Date(
    Date.UTC(origin.getUTCFullYear() + 1 + DATA_RETENTION.PAID_BOOKING_ARCHIVE_YEARS, 0, 1),
  );
}
