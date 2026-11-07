import { and, eq } from 'drizzle-orm';
import { activities, rescheduleVouchers } from './schema';
import type { DrizzlePgDb } from './client';

import {
  verifyVoucherIsUsable,
  calculateVoucherApplication,
} from '../../core/domain/voucher-engine';
import type { VoucherQuotePort } from '../../core/ports/voucher-quote.port';
import { failure, unexpected } from '../../lib/errors';
import { ERROR_CODES } from '../../config/constants';
export class DrizzleVoucherQuoteRepository implements VoucherQuotePort {
  constructor(private readonly db: DrizzlePgDb) {}
  async quote(organizationId: string, activityId: string, code: string) {
    try {
      const [activity] = await this.db
        .select()
        .from(activities)
        .where(
          and(
            eq(activities.id, activityId),
            eq(activities.organizationId, organizationId),
            eq(activities.isActive, true),
          ),
        );
      const [voucher] = await this.db
        .select()
        .from(rescheduleVouchers)
        .where(
          and(
            eq(rescheduleVouchers.code, code),
            eq(rescheduleVouchers.organizationId, organizationId),
          ),
        );
      if (!activity || !voucher || activity.currency !== voucher.currency)
        return failure(ERROR_CODES.VOUCHER_INVALID_OR_EXPIRED, 'VoucherQuote', 'quote');
      const usable = verifyVoucherIsUsable(voucher, organizationId, new Date());
      return usable.ok ? calculateVoucherApplication(usable.value, activity.priceCents) : usable;
    } catch {
      return unexpected('VoucherQuote', 'quote');
    }
  }
}
