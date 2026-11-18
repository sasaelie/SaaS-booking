import { sql } from 'drizzle-orm';
import type { DrizzlePgDb } from './client';
import { atomic, rows, type Transaction } from './transaction';
import { requireOperator } from './portal/authorization';
import { readPlatformSettings } from './portal/platform-settings-state';
import type {
  PlatformSettingsRepositoryPort,
  PublicPlatformSettings,
  PlatformSettingsState,
} from '../../core/ports/platform-settings';
import type { PortalActor } from '../../core/ports/portal-models';
import {
  PlatformPublicProfileSchema,
  type PlatformSettingsCommand,
} from '../../core/validation/platform-settings';
import { ERROR_CODES } from '../../config/constants';
import { failure } from '../../lib/errors';
import { ok } from '../../lib/result';
export class DrizzlePlatformSettingsRepository implements PlatformSettingsRepositoryPort {
  constructor(private readonly db: DrizzlePgDb) {}
  read(actor: PortalActor) {
    return atomic(this.db, 'PlatformSettings', async (tx) => {
      await requireOperator(tx, actor);
      return ok(await readPlatformSettings(tx));
    });
  }
  mutate(actor: PortalActor, command: PlatformSettingsCommand) {
    return atomic(this.db, 'PlatformSettings', async (tx) => {
      await requireOperator(tx, actor);
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended('platform-settings',0))`);
      const current = await readPlatformSettings(tx, true);
      if (command.revision !== current.revision)
        return failure(ERROR_CODES.CONFLICT, 'PlatformSettings', 'revision');
      await writeSettings(tx, actor, current, command);
      return ok(undefined);
    });
  }
  publicProfile() {
    return atomic(this.db, 'PublicPlatformSettings', async (tx) => {
      const [row] = await rows<PublicPlatformSettings>(
        tx,
        sql`SELECT mode,CASE WHEN mode='PUBLISHED' THEN published ELSE NULL END AS profile FROM platform_settings WHERE id=1`,
      );
      return ok({
        mode: row?.mode ?? 'ENVIRONMENT',
        profile: row?.mode === 'PUBLISHED' ? PlatformPublicProfileSchema.parse(row.profile) : null,
      });
    });
  }
}
async function writeSettings(
  tx: Transaction,
  actor: PortalActor,
  current: PlatformSettingsState,
  command: PlatformSettingsCommand,
) {
  const draft = command.action === 'save' ? command.profile : current.draft;
  const connection = command.action === 'connection' ? command.connection : current.connection;
  const revision = current.revision + 1;
  const published = command.action === 'publish' ? draft : current.published;
  const publishedRevision = command.action === 'publish' ? revision : current.publishedRevision;
  const mode =
    command.action === 'publish'
      ? 'PUBLISHED'
      : command.action === 'unpublish'
        ? 'HIDDEN'
        : current.mode;
  if (current.revision) {
    await tx.execute(
      sql`UPDATE platform_settings SET draft=${JSON.stringify(draft)}::jsonb,published=${published ? JSON.stringify(published) : null}::jsonb,connection=${JSON.stringify(connection)}::jsonb,revision=${revision},published_revision=${publishedRevision},mode=${mode},updated_by=${actor.id},updated_at=now(),published_by=CASE WHEN ${command.action === 'publish'} THEN ${actor.id} ELSE published_by END,published_at=CASE WHEN ${command.action === 'publish'} THEN now() ELSE published_at END WHERE id=1`,
    );
  } else {
    await tx.execute(sql`INSERT INTO platform_settings(id,draft,published,connection,revision,published_revision,mode,updated_by,published_by,published_at)
      VALUES(1,${JSON.stringify(draft)}::jsonb,${published ? JSON.stringify(published) : null}::jsonb,${JSON.stringify(connection)}::jsonb,${revision},${publishedRevision},${mode},${actor.id},${command.action === 'publish' ? actor.id : null},${command.action === 'publish' ? new Date() : null})`);
  }
  const actions = {
    save: 'PLATFORM_PROFILE_DRAFT_SAVED',
    publish: 'PLATFORM_PROFILE_PUBLISHED',
    unpublish: 'PLATFORM_PROFILE_UNPUBLISHED',
    connection: 'PLATFORM_PEPPOL_PREPARED',
  } as const;
  await tx.execute(
    sql`INSERT INTO platform_audit(actor_user_id,action) VALUES(${actor.id},${actions[command.action]})`,
  );
}
