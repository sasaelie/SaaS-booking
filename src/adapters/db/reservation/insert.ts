import { issueRemainder } from '../vouchers/remainder';
import { bookings } from '../schema';
import type { Transaction } from '../transaction';
import { prepareReservation, type InsertContext } from './prepare';
import { initialState } from './state';
import { reservationValues } from './values';
import { consumeVoucher } from './voucher';
import { enqueue } from '../jobs/enqueue';
import { bankReference } from './bank-reference';
import { BOOKING_STATUSES, JOB_TYPES, PAYMENT_MODES } from '../../../config/constants';
import { initializeFinancial } from '../financial-ledger';
export async function insertReservation(tx: Transaction, context: InsertContext) {
  const prepared = await prepareReservation(tx, context);
  const state = initialState(context.activity, prepared.voucher, context.now);
  const id = crypto.randomUUID();
  await consumeVoucher(tx, prepared.voucher, id, state.lockedUntil, context.now);
  const reference =
    state.paymentMode === PAYMENT_MODES.BANK_TRANSFER ? await bankReference(tx) : null;
  const [inserted] = await tx
    .insert(bookings)
    .values(reservationValues(context, prepared, id, state, reference))
    .returning();
  if (!inserted) throw Error('Insertion missing');
  await initializeFinancial(tx, inserted);
  await issueRemainder(tx, id, inserted.organizationId);
  if (inserted.status === BOOKING_STATUSES.CONFIRMED)
    await enqueue(tx, inserted.organizationId, JOB_TYPES.CONFIRMATION, `confirmation:${id}`, {
      bookingId: id,
    });
  return inserted;
}
