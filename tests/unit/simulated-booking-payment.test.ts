import { expect, it, vi } from 'vitest';
import { SimulatedBookingPaymentUseCase } from '../../src/core/use-cases/simulated-booking-payment.use-case';
import type { CreateBookingOutput } from '../../src/core/use-cases/create-booking.use-case';
import { BOOKING_STATUSES, ERROR_CODES } from '../../src/config/constants';
import { ok } from '../../src/lib/result';
import { failure } from '../../src/lib/errors';
const pending: CreateBookingOutput = {
  bookingId: 'test-booking',
  sessionId: 'test-session',
  status: BOOKING_STATUSES.PENDING_PAYMENT,
  amountToPayCents: 2500,
  lockedUntil: new Date('2027-01-01'),
  checkoutUrl: '/manage#token=test',
  bankInstructions: null,
  selfServiceToken: 'test-token',
  availabilityAfterBooking: {
    capacity: 5,
    occupiedSeats: 1,
    remainingSeats: 4,
    displayLabel: '4 / 5',
    isBookable: true,
  },
};
it('confirms through the simulator before reporting a successful payment', async () => {
  const create = { execute: vi.fn(async () => ok(pending)) };
  const simulator = { payment: vi.fn(async () => ok(undefined)) };
  const result = await new SimulatedBookingPaymentUseCase(create, simulator).execute({});
  expect(simulator.payment).toHaveBeenCalledWith(pending.bookingId, true);
  expect(result).toMatchObject({
    ok: true,
    value: {
      status: BOOKING_STATUSES.CONFIRMED,
      amountToPayCents: 0,
      checkoutUrl: null,
      paymentSimulated: true,
      selfServiceToken: pending.selfServiceToken,
    },
  });
  expect(pending.amountToPayCents).toBe(2500);
});
it('never claims success when simulated confirmation fails', async () => {
  const failed = failure(ERROR_CODES.CONFLICT, 'Test', 'expired');
  const simulator = { payment: vi.fn(async () => failed) };
  const result = await new SimulatedBookingPaymentUseCase(
    { execute: async () => ok(pending) },
    simulator,
  ).execute({});
  expect(result).toBe(failed);
});
it('does not simulate payment when creating the reservation fails', async () => {
  const failed = failure(ERROR_CODES.SESSION_FULL, 'Test', 'full');
  const simulator = { payment: vi.fn(async () => ok(undefined)) };
  expect(
    await new SimulatedBookingPaymentUseCase({ execute: async () => failed }, simulator).execute(
      {},
    ),
  ).toBe(failed);
  expect(simulator.payment).not.toHaveBeenCalled();
});
it('leaves offline, free and bank transfer bookings unchanged', async () => {
  for (const booking of [
    { ...pending, checkoutUrl: null, status: BOOKING_STATUSES.CONFIRMED },
    {
      ...pending,
      checkoutUrl: null,
      bankInstructions: { iban: 'TEST', accountName: 'TEST', reference: 'TEST' },
    },
  ]) {
    const simulator = { payment: vi.fn(async () => ok(undefined)) };
    expect(
      await new SimulatedBookingPaymentUseCase(
        { execute: async () => ok(booking) },
        simulator,
      ).execute({}),
    ).toEqual(ok(booking));
    expect(simulator.payment).not.toHaveBeenCalled();
  }
});
it('normalizes an already confirmed checkout replay without charging again', async () => {
  const simulator = { payment: vi.fn(async () => ok(undefined)) };
  const result = await new SimulatedBookingPaymentUseCase(
    { execute: async () => ok({ ...pending, status: BOOKING_STATUSES.CONFIRMED }) },
    simulator,
  ).execute({});
  expect(result).toMatchObject({ ok: true, value: { checkoutUrl: null, paymentSimulated: true } });
  expect(simulator.payment).not.toHaveBeenCalled();
});
