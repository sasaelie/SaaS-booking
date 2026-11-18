import type { PortalIdentityPort } from '../../ports/portal-identity.port';
import type { PlatformSettingsRepositoryPort } from '../../ports/platform-settings';
import { PlatformSettingsCommandSchema } from '../../validation/platform-settings';
import { withPortalActor } from './actor';
import { failure } from '../../../lib/errors';
import { ERROR_CODES } from '../../../config/constants';
export class PlatformSettingsUseCase {
  constructor(
    private readonly identity: PortalIdentityPort,
    private readonly repository: PlatformSettingsRepositoryPort,
  ) {}
  read() {
    return withPortalActor(this.identity, 'PlatformSettings', (actor) =>
      this.repository.read(actor),
    );
  }
  mutate(raw: unknown) {
    return withPortalActor(this.identity, 'PlatformSettings', async (actor) => {
      const parsed = PlatformSettingsCommandSchema.safeParse(raw);
      return parsed.success
        ? this.repository.mutate(actor, parsed.data)
        : failure(ERROR_CODES.VALIDATION_FAILED, 'PlatformSettings', 'command');
    });
  }
}
