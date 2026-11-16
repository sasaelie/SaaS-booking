import { expect, it, vi } from 'vitest';
import { SimulationParticipantLoginUseCase } from '../../src/core/use-cases/simulation-participant-login.use-case';
import { ok } from '../../src/lib/result';
const code = `TEST-${'A'.repeat(32)}-${'B'.repeat(32)}`;
it('authorizes a TEST capability without requiring or creating an organizer identity', async () => {
  const target = { organizationId: crypto.randomUUID(), token: 'signed' };
  const resolve = vi.fn(async () => ok(target));
  const useCase = new SimulationParticipantLoginUseCase({ resolve });
  expect(await useCase.execute({ code: ` ${code.toLowerCase()} ` })).toEqual(ok(target));
  expect(resolve).toHaveBeenCalledWith(code, expect.any(Date));
});
it('rejects real codes and malformed input before accessing simulation data', async () => {
  const resolve = vi.fn(async () => ok({ organizationId: crypto.randomUUID(), token: 'signed' }));
  const useCase = new SimulationParticipantLoginUseCase({ resolve });
  expect((await useCase.execute({ code: code.replace('TEST', 'CLI') })).ok).toBe(false);
  expect((await useCase.execute({ code: 'TEST-invalid' })).ok).toBe(false);
  expect((await useCase.execute({ code, bookingId: crypto.randomUUID() })).ok).toBe(false);
  expect(resolve).not.toHaveBeenCalled();
});
