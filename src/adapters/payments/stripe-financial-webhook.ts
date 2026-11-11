import type { Transaction } from '../db/transaction';
import Stripe from 'stripe';
import { z } from 'zod';
import { and, eq, sql } from 'drizzle-orm';
import { bookings, financialPayments, organizations } from '../db/schema';
import { atomic } from '../db/transaction';
import type { DrizzlePgDb } from '../db/client';
import { enqueue } from '../db/jobs/enqueue';
import { recordFinancialRefund } from '../db/financial-ledger';
import { ok, type Result } from '../../lib/result';
import { failure } from '../../lib/errors';
import { ERROR_CODES, JOB_TYPES } from '../../config/constants';
const ChargeSchema = z.object({
  id: z.string(),
  payment_intent: z.string(),
  amount: z.number().int(),
  amount_refunded: z.number().int().default(0),
  refunds: z
    .object({
      data: z.array(
        z.object({
          id: z.string(),
          amount: z.number().int().nonnegative(),
          status: z.string().nullable(),
        }),
      ),
    })
    .optional(),
  metadata: z.object({ booking_id: z.uuid(), organization_id: z.uuid() }),
});
export class StripeFinancialWebhook {
  constructor(
    private readonly db: DrizzlePgDb,
    private readonly stripe: Stripe,
    private readonly secret: string,
  ) {}
  async handle(body: string, signature: string): Promise<Result<void>> {
    let event;
    try {
      event = this.stripe.webhooks.constructEvent(body, signature, this.secret);
    } catch {
      return failure(ERROR_CODES.UNAUTHORIZED, 'FinancialWebhook', 'signature');
    }
    if (event.type === 'payout.paid' && event.account)
      return this.payout(event.account, event.data.object.id);
    if (event.type === 'charge.updated' || event.type === 'charge.refunded')
      return this.charge(event);
    if (event.type === 'charge.dispute.created' || event.type === 'charge.dispute.closed')
      return this.dispute(event);
    return ok(undefined);
  }
  private charge(event: Stripe.Event) {
    const parsed = ChargeSchema.safeParse(event.data.object);
    if (!parsed.success) return Promise.resolve(ok(undefined));
    const charge = parsed.data;
    return atomic(this.db, 'FinancialWebhook', async (tx) => {
      const booking = await financialBooking(tx, charge.metadata);
      if (!booking || booking.commercialPlan === 'LEGACY') return ok(undefined);
      const account = booking.chargeModel === 'DIRECT' ? booking.merchantAccountId : null;
      if (
        (event.account ?? null) !== account ||
        booking.paymentReference !== charge.payment_intent ||
        charge.amount !== booking.amountPaidCents
      )
        return failure(ERROR_CODES.UNAUTHORIZED, 'FinancialWebhook', 'scope');
      const [payment] = await tx
        .select()
        .from(financialPayments)
        .where(eq(financialPayments.bookingId, booking.id))
        .for('update');
      if (event.type === 'charge.refunded' && payment)
        for (const refund of charge.refunds?.data ?? [])
          if (refund.status === 'succeeded')
            await recordFinancialRefund(tx, booking.id, refund.id, refund.amount);
      await enqueue(
        tx,
        booking.organizationId,
        JOB_TYPES.FINANCIAL_RECONCILE,
        `stripe-financial:${event.id}`,
        { bookingId: booking.id },
      );
      return ok(undefined);
    });
  }
  private payout(account: string, payoutId: string) {
    return atomic(this.db, 'FinancialPayout', async (tx) => {
      const list = await tx
        .select({ id: organizations.id })
        .from(organizations)
        .where(eq(organizations.merchantAccountId, account));
      for (const organization of list)
        await enqueue(
          tx,
          organization.id,
          JOB_TYPES.FINANCIAL_PAYOUT,
          `payout:${payoutId}:${organization.id}`,
          { organizationId: organization.id, merchantAccountId: account, payoutId },
        );
      return ok(undefined);
    });
  }
  private async dispute(event: Stripe.Event) {
    const parsed = z
      .object({ id: z.string(), payment_intent: z.string() })
      .safeParse(event.data.object);
    if (!parsed.success) return ok(undefined);
    let current;
    try {
      current = await this.stripe.disputes.retrieve(
        parsed.data.id,
        {},
        event.account ? { stripeAccount: event.account } : {},
      );
    } catch {
      return failure(ERROR_CODES.PAYMENT_PROVIDER_ERROR, 'FinancialDispute', 'retrieve');
    }
    const intent =
      typeof current.payment_intent === 'string'
        ? current.payment_intent
        : current.payment_intent?.id;
    if (intent !== parsed.data.payment_intent)
      return failure(ERROR_CODES.UNAUTHORIZED, 'FinancialDispute', 'scope');
    const open = !['won', 'lost', 'warning_closed'].includes(current.status);
    return atomic(this.db, 'FinancialDispute', async (tx) => {
      await tx.execute(sql`UPDATE bookings SET dispute_open=${open}
        WHERE payment_reference=${parsed.data.payment_intent} AND ((charge_model='DESTINATION' AND ${event.account ?? null}::text IS NULL) OR (charge_model='DIRECT' AND merchant_account_id IS NOT DISTINCT FROM ${event.account ?? null}))`);
      return ok(undefined);
    });
  }
}

async function financialBooking(
  tx: Transaction,
  metadata: z.infer<typeof ChargeSchema>['metadata'],
) {
  const [booking] = await tx
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.id, metadata.booking_id),
        eq(bookings.organizationId, metadata.organization_id),
      ),
    )
    .for('update');
  return booking;
}
