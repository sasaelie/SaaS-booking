import type { Result } from '../../lib/result';
import type { PortalActor } from './portal-models';
import type {
  PlatformConnection,
  PlatformPublicProfile,
  PlatformSettingsCommand,
} from '../validation/platform-settings';
export type PlatformPublicationMode = 'ENVIRONMENT' | 'PUBLISHED' | 'HIDDEN';
export type PlatformSettingsState = {
  draft: PlatformPublicProfile;
  published: PlatformPublicProfile | null;
  connection: PlatformConnection;
  revision: number;
  publishedRevision: number | null;
  mode: PlatformPublicationMode;
};
export type PublicPlatformSettings = {
  mode: PlatformPublicationMode;
  profile: PlatformPublicProfile | null;
};
export interface PlatformSettingsRepositoryPort {
  read(actor: PortalActor): Promise<Result<PlatformSettingsState>>;
  mutate(actor: PortalActor, command: PlatformSettingsCommand): Promise<Result<undefined>>;
  publicProfile(): Promise<Result<PublicPlatformSettings>>;
}
