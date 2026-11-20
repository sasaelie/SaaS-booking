import { sql } from 'drizzle-orm';
import { rows, type Executor } from '../transaction';
import type { PlatformSettingsState } from '../../../core/ports/platform-settings';
import {
  PlatformPublicProfileSchema,
  PlatformConnectionSchema,
} from '../../../core/validation/platform-settings';
export function emptyPlatformSettings(): PlatformSettingsState {
  return {
    draft: PlatformPublicProfileSchema.parse({}),
    published: null,
    connection: PlatformConnectionSchema.parse({}),
    revision: 0,
    publishedRevision: null,
    mode: 'ENVIRONMENT',
  };
}
export async function readPlatformSettings(
  tx: Executor,
  lock = false,
): Promise<PlatformSettingsState> {
  const [state] = await rows<PlatformSettingsState>(
    tx,
    sql`SELECT draft,published,connection,revision,published_revision AS "publishedRevision",mode FROM platform_settings WHERE id=1 ${lock ? sql`FOR UPDATE` : sql``}`,
  );
  if (!state) return emptyPlatformSettings();
  return {
    ...state,
    draft: PlatformPublicProfileSchema.parse(state.draft),
    published: state.published ? PlatformPublicProfileSchema.parse(state.published) : null,
    connection: PlatformConnectionSchema.parse(state.connection),
  };
}
