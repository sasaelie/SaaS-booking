import { afterAll, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { db, pool } from './database';
import { fixture, rawInput } from './fixtures';
import { portalFixture } from './portal-fixtures';
import { createDatabase } from '../../src/adapters/db/client';
import { syncSimulation } from '../../src/adapters/simulation/sync';
import { simulationServices } from '../../src/composition/simulation-services';
import { SimulationPaymentAdapter } from '../../src/adapters/simulation/payment.adapter';
import { ParticipantAccessRepository } from '../../src/adapters/db/participant/repository';
import { SimulationParticipantLoginRepository } from '../../src/adapters/simulation/participant-login.repository';
import { SimulationRepository } from '../../src/adapters/simulation/repository';
import { verifySelfCancelToken } from '../../src/core/domain/self-service-token';
import { SimulationParticipantUseCase } from '../../src/core/use-cases/simulation-participant.use-case';
import { required } from '../../src/adapters/db/transaction';
const secret = 'simulation-login-test-only-secret-at-least-32-characters';
const target = createDatabase(process.env['TEST_DATABASE_URL'] ?? '', 'public_simulation');
afterAll(() => target.pool.end());
async function setup() {
  const organizer = await portalFixture();
  const context = await fixture('NONE');
  await db.execute(
    sql`INSERT INTO organization_members(organization_id,user_id,role) VALUES(${context.organizationId},${organizer.actor.id},'OWNER')`,
  );
  required(await syncSimulation(pool, 'public', context.organizationId));
  const app = simulationServices(
    target.db,
    context.organizationId,
    secret,
    'http://localhost',
    new SimulationPaymentAdapter(),
  );
  const page = required(
    await app.bookingPage.execute({ slug: context.organizationId, activityId: context.activityId }),
  );
  const booking = required(
    await app.createBooking.execute({
      ...rawInput(context),
      acceptedTermsVersionHash: page.terms.versionHash,
    }),
  );
  const ticket = await simulationTicket(context.organizationId, booking.bookingId);
  return {
    organizer,
    context,
    booking,
    ticket,
    app,
    repository: new SimulationParticipantLoginRepository(target.db, secret),
  };
}
async function simulationTicket(organizationId: string, bookingId: string) {
  const ticket = required(
    await new ParticipantAccessRepository(target.db, secret, 'http://localhost', true).ticket(
      { organizationId, bookingId, version: 0, expUnixSeconds: Number.MAX_SAFE_INTEGER },
      new Date(),
    ),
  );
  if (!ticket) throw Error('TEST ticket missing');
  return ticket;
}
it('opens a valid TEST code without organizer identity or creating a real booking or participant session', async () => {
  const s = await setup();
  const result = required(await s.repository.resolve(s.ticket.code, new Date()));
  expect(result.organizationId).toBe(s.context.organizationId);
  const payload = required(await verifySelfCancelToken(result.token, secret, new Date()));
  expect(payload.bookingId).toBe(s.booking.bookingId);
  expect((await s.app.selfBooking.execute(result.token)).ok).toBe(true);
  expect(
    (
      await verifySelfCancelToken(
        result.token,
        'different-real-secret-at-least-32-characters',
        new Date(),
      )
    ).ok,
  ).toBe(false);
  const rows = await pool.query(
    'SELECT (SELECT count(*) FROM bookings WHERE organization_id=$1) AS bookings,(SELECT count(*) FROM participant_booking_sessions WHERE organization_id=$1) AS sessions',
    [s.context.organizationId],
  );
  expect(rows.rows[0]).toEqual({ bookings: '0', sessions: '0' });
});
it('rejects modified codes and keeps TEST access isolated from real participant sessions', async () => {
  const s = await setup();
  const changed = s.ticket.code.slice(0, -1) + (s.ticket.code.endsWith('A') ? 'B' : 'A');
  expect((await s.repository.resolve(changed, new Date())).ok).toBe(false);
  const real = new ParticipantAccessRepository(db, secret, 'http://localhost');
  expect((await real.exchange(s.ticket.code, null, new Date())).ok).toBe(false);
});
it('rejects revoked and deleted simulation tickets', async () => {
  const s = await setup();
  await target.db.execute(
    sql`UPDATE booking_access_credentials SET revoked_at=now() WHERE booking_id=${s.booking.bookingId}`,
  );
  expect((await s.repository.resolve(s.ticket.code, new Date())).ok).toBe(false);
  await target.db.execute(
    sql`UPDATE booking_access_credentials SET revoked_at=NULL WHERE booking_id=${s.booking.bookingId}`,
  );
  required(
    await new SimulationRepository(target.db, s.context.organizationId, secret).delete(
      s.booking.bookingId,
    ),
  );
  expect((await s.repository.resolve(s.ticket.code, new Date())).ok).toBe(false);
});

it('allows guest cancellation only in simulation and revokes both code and signed access on deletion', async () => {
  const s = await setup();
  const { token } = required(await s.repository.resolve(s.ticket.code, new Date()));
  const guest = new SimulationParticipantUseCase(s.app.selfBooking, s.app.cancellation);
  expect((await guest.execute('context', { token })).ok).toBe(true);
  expect((await guest.execute('payment', { token })).ok).toBe(false);
  expect((await guest.execute('cancel', { token, bookingId: crypto.randomUUID() })).ok).toBe(false);
  expect((await guest.execute('cancel', { token })).ok).toBe(true);
  const result = await target.pool.query('SELECT status FROM bookings WHERE id=$1', [
    s.booking.bookingId,
  ]);
  expect(result.rows[0]?.status).toBe('CANCELLED_BY_ATTENDEE');
  const real = await pool.query('SELECT id FROM bookings WHERE organization_id=$1', [
    s.context.organizationId,
  ]);
  expect(real.rows).toHaveLength(0);
  required(
    await new SimulationRepository(target.db, s.context.organizationId, secret).delete(
      s.booking.bookingId,
    ),
  );
  expect((await guest.execute('context', { token })).ok).toBe(false);
  expect((await guest.execute('cancel', { token })).ok).toBe(false);
  expect((await s.repository.resolve(s.ticket.code, new Date())).ok).toBe(false);
});
