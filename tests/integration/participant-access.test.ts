import { expect, it } from 'vitest';
import { eq, sql } from 'drizzle-orm';
import { db } from './database';
import { fixture, rawInput, reserve } from './fixtures';
import { bookings } from '../../src/adapters/db/schema';
import { required, rows } from '../../src/adapters/db/transaction';
import { ParticipantTicketSchema } from '../../src/core/validation/participant';
import { confirmed, repository } from './participant-fixtures';
it('issues once at confirmation, reprints the same code, and rejects fabricated signatures', async () => {
  const setup = await confirmed();
  expect(ParticipantTicketSchema.safeParse(setup.ticket).success).toBe(true);
  expect(setup.ticket.qrDataUrl).toMatch(/^data:image\/png;base64,/);
  required(await reserve(setup.input));
  const repeated = required(await repository().ticket(setup.payload, new Date()));
  expect(repeated?.code).toBe(setup.ticket.code);
  const count = await rows<{ count: string }>(
    db,
    sql`SELECT count(*) FROM booking_access_credentials WHERE booking_id=${setup.booking.bookingId}`,
  );
  expect(count[0]?.count).toBe('1');
  expect(
    (await repository().authorizeCode(setup.ticket.code.slice(0, -1) + 'Z', new Date())).ok,
  ).toBe(false);
  expect(
    (await repository().authorizeCode(setup.ticket.code.replace(/^CLI/, 'TEST'), new Date())).ok,
  ).toBe(false);
});

it('does not issue an admission ticket for a payment still pending', async () => {
  const context = await fixture('BANK_TRANSFER');
  const booking = required(await reserve(rawInput(context)));
  const payload = {
    organizationId: context.organizationId,
    bookingId: booking.bookingId,
    version: 0,
    expUnixSeconds: Number.MAX_SAFE_INTEGER,
  };
  expect(required(await repository().ticket(payload, new Date()))).toBeNull();
  await db
    .update(bookings)
    .set({ status: 'CONFIRMED', confirmedAt: new Date() })
    .where(eq(bookings.id, booking.bookingId));
  expect(required(await repository().ticket(payload, new Date()))?.code).toMatch(/^CLI-/);
});

it('keeps multiple booking grants in one browser and enforces organization and version boundaries', async () => {
  const first = await confirmed();
  const second = await confirmed();
  const auth = required(await repository().exchange(first.ticket.code, null, new Date()));
  expect(
    (await repository().authorize(auth.browserToken, second.booking.bookingId, new Date())).ok,
  ).toBe(false);
  required(await repository().exchange(second.ticket.code, auth.browserToken, new Date()));
  expect(
    (await repository().authorize(auth.browserToken, first.booking.bookingId, new Date())).ok,
  ).toBe(true);
  expect(
    (await repository().authorize(auth.browserToken, second.booking.bookingId, new Date())).ok,
  ).toBe(true);
  expect(
    (
      await repository().ticket(
        { ...first.payload, organizationId: second.context.organizationId },
        new Date(),
      )
    ).ok,
  ).toBe(false);
  await db
    .update(bookings)
    .set({ selfServiceVersion: 1 })
    .where(eq(bookings.id, first.booking.bookingId));
  expect(
    (await repository().authorize(auth.browserToken, first.booking.bookingId, new Date())).ok,
  ).toBe(false);
  expect((await repository().authorizeCode(first.ticket.code, new Date())).ok).toBe(false);
});
