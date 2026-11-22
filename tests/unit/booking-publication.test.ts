import { expect, it, vi } from 'vitest';
import { BookingPublicationUseCase } from '../../src/core/use-cases/portal/booking-publication.use-case';
import type { BookingPublicationPort } from '../../src/core/ports/booking-publication.port';
import { ok, err } from '../../src/lib/result';
import { errorValue } from '../../src/lib/errors';
import { ERROR_CODES } from '../../src/config/constants';
const organizationId = '9006c789-25a0-4455-8adb-0e8d17ba192b';
const actor = { id: 'owner', email: 'owner@example.com', name: 'Owner' };
const target = { appUrl: 'https://test.example.com', published: true, activationRequired: false };
function setup() {
  const repository: BookingPublicationPort = {
    read: vi.fn(async () => ok(target)),
    publish: vi.fn(async () => ok(undefined)),
  };
  const service = new BookingPublicationUseCase({ current: async () => ok(actor) }, repository);
  return { service, repository };
}
it('requires explicit acknowledgement before publishing any organization configuration', async () => {
  const { service, repository } = setup();
  expect((await service.publish({ organizationId })).ok).toBe(false);
  expect((await service.publish({ organizationId, acknowledged: false })).ok).toBe(false);
  expect(repository.publish).not.toHaveBeenCalled();
  expect((await service.publish({ organizationId, acknowledged: true })).ok).toBe(true);
  expect(repository.publish).toHaveBeenCalledWith(actor, organizationId);
});
it('never publishes or returns another account’s target when authorization fails', async () => {
  const { service, repository } = setup();
  const denied = err(errorValue(ERROR_CODES.UNAUTHORIZED, 'PublicationTest', 'owner'));
  vi.mocked(repository.publish).mockResolvedValue(denied);
  expect(await service.publish({ organizationId, acknowledged: true })).toEqual(denied);
  vi.mocked(repository.read).mockResolvedValue(denied);
  expect(await service.read({ organizationId })).toEqual(denied);
  const signedOut = new BookingPublicationUseCase({ current: async () => denied }, repository);
  vi.mocked(repository.publish).mockClear();
  expect((await signedOut.publish({ organizationId, acknowledged: true })).ok).toBe(false);
  expect(repository.publish).not.toHaveBeenCalled();
});
it('reads the target from published state and rejects malformed identifiers', async () => {
  const { service, repository } = setup();
  expect(await service.read({ organizationId })).toEqual(ok(target));
  expect((await service.publish({ organizationId: '../app', acknowledged: true })).ok).toBe(false);
  expect(repository.publish).not.toHaveBeenCalled();
});
