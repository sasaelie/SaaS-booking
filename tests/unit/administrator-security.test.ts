import { expect, it, vi } from 'vitest';
import {
  AdministratorSecurityCommandSchema,
  RecoveryCodeSchema,
} from '../../src/core/validation/administrator-security';
import { AdministratorSecurityUseCase } from '../../src/core/use-cases/portal/administrator-security.use-case';
import { ok } from '../../src/lib/result';
import { failure } from '../../src/lib/errors';
import { ERROR_CODES } from '../../src/config/constants';
it('accepts same-device setup and normalizes manually entered recovery codes', () => {
  expect(
    AdministratorSecurityCommandSchema.safeParse({
      action: 'register-options',
      password: 'secret',
      label: 'Mon téléphone',
    }).success,
  ).toBe(true);
  expect(RecoveryCodeSchema.parse('aaaa aaaa-bbbbBBBB-cccccccc-dddddddd')).toBe(
    'AAAAAAAABBBBBBBBCCCCCCCCDDDDDDDD',
  );
});
it('does not reach protected mutations after a rejected password proof', async () => {
  const mutate = vi.fn(),
    verify = vi.fn(async () => failure(ERROR_CODES.UNAUTHORIZED, 'Test', 'password'));
  const service = new AdministratorSecurityUseCase(
    { current: async () => ok({ id: 'u', name: 'N', email: 'a@example.com' }) },
    { read: vi.fn(), mutate },
    { verify },
    { accept: async () => ok(undefined) },
  );
  expect((await service.mutate({ action: 'disable', password: 'wrong' })).ok).toBe(false);
  expect(mutate).not.toHaveBeenCalled();
});
it('limits attempts before computing password proofs', async () => {
  const verify = vi.fn(),
    mutate = vi.fn();
  const service = new AdministratorSecurityUseCase(
    { current: async () => ok({ id: 'u', name: 'N', email: 'a@example.com' }) },
    { read: vi.fn(), mutate },
    { verify },
    { accept: async () => failure(ERROR_CODES.RATE_LIMITED, 'Test', 'rate') },
  );
  const result = await service.mutate({ action: 'disable', password: 'secret' });
  expect(result.ok ? null : result.error.code).toBe('RATE_LIMITED');
  expect(verify).not.toHaveBeenCalled();
  expect(mutate).not.toHaveBeenCalled();
});
it.each([
  { action: 'activate', code: '123456' },
  { action: 'disable', password: 'secret', userId: 'other' },
  { action: 'authenticate-finish', response: { verified: true } },
  { action: 'register-options', password: '', label: 'x' },
])('refuses forged security commands %j', (input) => {
  expect(AdministratorSecurityCommandSchema.safeParse(input).success).toBe(false);
});
it('validates commands and requires a server password proof before protected changes', async () => {
  const mutate = vi.fn(async () => ok({})),
    verify = vi.fn(async () => ok(undefined));
  const service = new AdministratorSecurityUseCase(
    { current: async () => ok({ id: 'u', name: 'N', email: 'a@example.com' }) },
    { read: vi.fn(), mutate },
    { verify },
    { accept: async () => ok(undefined) },
  );
  expect((await service.mutate({ action: 'disable', password: 'secret' })).ok).toBe(true);
  expect(verify).toHaveBeenCalledWith('secret');
  await service.mutate({ action: 'disable', password: 'secret', userId: 'other' });
  expect(mutate).toHaveBeenCalledTimes(1);
});
