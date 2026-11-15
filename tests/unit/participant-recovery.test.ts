import { expect, it, vi } from 'vitest';
import { ParticipantRecoveryUseCase } from '../../src/core/use-cases/participant-recovery.use-case';
import { ok } from '../../src/lib/result';
import { failure } from '../../src/lib/errors';
it('never requests a code without a verified organizer identity or validated tenant identifiers', async () => {
  const recover = vi.fn(async () => ok('private-code'));
  const denied = new ParticipantRecoveryUseCase(
    { current: async () => failure('UNAUTHORIZED', 'Test', 'identity') },
    { recover },
  );
  expect(
    (await denied.execute({ organizationId: crypto.randomUUID(), bookingId: crypto.randomUUID() }))
      .ok,
  ).toBe(false);
  const authorized = new ParticipantRecoveryUseCase(
    { current: async () => ok({ id: 'organizer', name: 'Test', email: 'test@example.com' }) },
    { recover },
  );
  expect((await authorized.execute({ organizationId: 'invalid', bookingId: 'invalid' })).ok).toBe(
    false,
  );
  expect(recover).not.toHaveBeenCalled();
});
