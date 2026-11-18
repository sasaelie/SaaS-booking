import type { PlatformSettingsRepositoryPort } from '../ports/platform-settings';
export class PublicPlatformSettingsUseCase {
  constructor(private readonly repository: PlatformSettingsRepositoryPort) {}
  read() {
    return this.repository.publicProfile();
  }
}
