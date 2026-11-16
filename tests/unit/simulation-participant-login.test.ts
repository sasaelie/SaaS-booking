import { expect, it, vi } from 'vitest';
import { SimulationParticipantLoginUseCase } from '../../src/core/use-cases/simulation-participant-login.use-case';
import { ok } from '../../src/lib/result';
import { failure } from '../../src/lib/errors';
const code = `TEST-${'A'.repeat(32)}-${'B'.repeat(32)}`;
it('requires a verified organizer before looking up any TEST credential', async () => {
  const resolve = vi.fn(async () => ok({ organizationId: crypto.randomUUID(), token: 'signed' }));
  const useCase = new SimulationParticipantLoginUseCase(
    { current: async () => failure('UNAUTHORIZED', 'Test', 'identity') },
    { resolve },
  );
  expect((await useCase.execute({ code })).ok).toBe(false);
  expect(resolve).not.toHaveBeenCalled();
});
it('normalizes TEST input and never routes a real client code through simulation access', async () => {
  const actor = { id: 'organizer', name: 'Test', email: 'test@example.invalid' };
  const target = { organizationId: crypto.randomUUID(), token: 'signed' };
  const resolve = vi.fn(async () => ok(target));
  const useCase = new SimulationParticipantLoginUseCase(
    { current: async () => ok(actor) },
    { resolve },
  );
  expect((await useCase.execute({ code: code.replace('TEST', 'CLI') })).ok).toBe(false);
  expect(resolve).not.toHaveBeenCalled();
  expect(await useCase.execute({ code: ` ${code.toLowerCase()} ` })).toEqual(ok(target));
  expect(resolve).toHaveBeenCalledWith(actor, code, expect.any(Date));
});
