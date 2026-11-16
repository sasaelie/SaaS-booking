import { expect, it, vi } from 'vitest';
import { SendBookingConfirmationUseCase } from '../../src/core/use-cases/send-booking-confirmation.use-case';
import type { JobRunnerPort } from '../../src/core/ports/jobs.port';
import { ok, err } from '../../src/lib/result';
import { errorValue } from '../../src/lib/errors';
import { ERROR_CODES } from '../../src/config/constants';
function setup() {
  const send = vi.fn().mockResolvedValue(ok({ completed: 1, deferred: 0 }));
  const runner: JobRunnerPort = {
    runConfirmation: send,
    runCancellationBatch: vi.fn(),
    runBatch: vi.fn(),
  };
  return { send, useCase: new SendBookingConfirmationUseCase(runner) };
}
it('rejects a malformed notification scope without consuming the background queue', async () => {
  const { send, useCase } = setup();
  expect(
    (await useCase.execute({ organizationId: 'invalid', bookingId: crypto.randomUUID() })).ok,
  ).toBe(false);
  expect(send).not.toHaveBeenCalled();
});
it('dispatches only the validated confirmed booking scope and preserves a recoverable mail failure', async () => {
  const { send, useCase } = setup();
  const scope = { organizationId: crypto.randomUUID(), bookingId: crypto.randomUUID() };
  expect((await useCase.execute(scope)).ok).toBe(true);
  expect(send).toHaveBeenCalledWith(scope.organizationId, scope.bookingId);
  send.mockResolvedValueOnce(err(errorValue(ERROR_CODES.INTERNAL_ERROR, 'MailTest', 'send')));
  expect((await useCase.execute(scope)).ok).toBe(false);
});
