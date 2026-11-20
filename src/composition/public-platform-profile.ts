import 'server-only';
import { cache } from 'react';
import { runtime } from './runtime';
import { DrizzlePlatformSettingsRepository } from '../adapters/db/drizzle-platform-settings.repository';
import { PublicPlatformSettingsUseCase } from '../core/use-cases/public-platform-settings.use-case';
import { PlatformPublicProfileSchema } from '../core/validation/platform-settings';
import { publicProfile } from '../lib/public-profile';
export const publicPlatformProfile = cache(async () => {
  const empty = PlatformPublicProfileSchema.parse({});
  const app = runtime();
  if (!app.ok) return empty;
  const result = await new PublicPlatformSettingsUseCase(
    new DrizzlePlatformSettingsRepository(app.value.db),
  ).read();
  if (!result.ok) return empty;
  if (result.value.mode === 'PUBLISHED' && result.value.profile) return result.value.profile;
  if (result.value.mode === 'HIDDEN') return empty;
  const legacy = publicProfile();
  return PlatformPublicProfileSchema.parse(
    Object.fromEntries(Object.entries(legacy).map(([key, value]) => [key, value ?? ''])),
  );
});
