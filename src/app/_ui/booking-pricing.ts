import { BOOKING_UI, FORM_LABELS, PAYMENT_MODES, type PaymentMode } from '../../config/constants';
import type { BookingFlowState } from './use-booking-flow';
function actionLabel(mode: PaymentMode, amount: number): string {
  if (amount === 0 || mode === PAYMENT_MODES.NONE) return BOOKING_UI.CONFIRM;
  return mode === PAYMENT_MODES.STRIPE ? BOOKING_UI.PAY : BOOKING_UI.BANK_BOOK;
}
function paymentNote(mode: PaymentMode, amount: number, covered: boolean): string {
  if (covered) return BOOKING_UI.COVERED;
  if (amount === 0) return BOOKING_UI.FREE;
  if (mode === PAYMENT_MODES.NONE) return BOOKING_UI.NO_PAYMENT;
  return mode === PAYMENT_MODES.STRIPE ? BOOKING_UI.CARD_PAYMENT : BOOKING_UI.BANK_PAYMENT;
}
function totalLabel(mode: PaymentMode, amount: number): string {
  if (amount === 0) return BOOKING_UI.TOTAL;
  if (mode === PAYMENT_MODES.STRIPE) return BOOKING_UI.ONLINE_TOTAL;
  return mode === PAYMENT_MODES.BANK_TRANSFER ? BOOKING_UI.BANK_TOTAL : BOOKING_UI.TARIFF;
}
export function bookingPricing(flow: BookingFlowState) {
  const amount = flow.quote.remaining ?? flow.data.priceCents;
  return {
    amount,
    discount: flow.data.priceCents - amount,
    label: flow.form.pending ? FORM_LABELS.SUBMITTING : actionLabel(flow.data.paymentMode, amount),
    note:
      !flow.data.paymentReady && amount > 0
        ? BOOKING_UI.PAYMENT_NOT_READY
        : paymentNote(flow.data.paymentMode, amount, flow.quote.remaining === 0),
    totalLabel: totalLabel(flow.data.paymentMode, amount),
  };
}
