import { sql } from 'drizzle-orm';
import { ERROR_CODES } from '../../config/constants';
import { ok } from '../../lib/result';
import { failure } from '../../lib/errors';
import type { DrizzlePgDb } from '../db/client';
import { atomic, rows } from '../db/transaction';
import { simulationPayment } from './operations';
export class PublicTestPaymentRepository {
  constructor(private readonly db: DrizzlePgDb) {}
  async payment(bookingId: string, success: boolean) {
    const result = await atomic<string>(this.db, 'PublicTestPayment', async (tx) => {
      const [booking] = await rows<{ organizationId: string }>(
        tx,
        sql`SELECT b.organization_id AS "organizationId" FROM bookings b
        JOIN publication p ON p.organization_id=b.organization_id AND p.enabled
        WHERE b.id=${bookingId}`,
      );
      if (!booking) return failure(ERROR_CODES.NOT_FOUND, 'PublicTestPayment', 'booking');
      return ok(booking.organizationId);
    });
    return result.ok ? simulationPayment(this.db, result.value, bookingId, success) : result;
  }
}
