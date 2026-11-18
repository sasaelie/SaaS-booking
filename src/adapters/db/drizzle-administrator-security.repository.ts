import { sql } from 'drizzle-orm';
import type { DrizzlePgDb } from './client';
import { atomic, rows } from './transaction';
import type { PortalActor } from '../../core/ports/portal-models';
import type {
  AdministratorSecurityRepositoryPort,
  PasskeyGatewayPort,
} from '../../core/ports/administrator-security';
import type { AdministratorSecurityCommand } from '../../core/validation/administrator-security';
import { requireSecuritySession, securityAccess } from './administrator-security/access';
import { readCredentials } from './administrator-security/credentials';
import { startCeremony, finishCeremony } from './administrator-security/ceremonies';
import { manageSecurity } from './administrator-security/management';
import { ok } from '../../lib/result';
import type { Result } from '../../lib/result';
import type { AdministratorSecurityReply } from '../../core/ports/administrator-security';
export class DrizzleAdministratorSecurityRepository implements AdministratorSecurityRepositoryPort {
  constructor(
    private readonly db: DrizzlePgDb,
    private readonly gateway: PasskeyGatewayPort,
  ) {}
  read(actor: PortalActor) {
    return atomic(this.db, 'AdministratorSecurity', async (tx) => {
      await requireSecuritySession(tx, actor);
      const access = await securityAccess(tx, actor),
        credentials = await readCredentials(tx, actor);
      const [count] = await rows<{ count: number }>(
        tx,
        sql`SELECT count(*)::int AS count FROM administrator_recovery_codes WHERE user_id=${actor.id}`,
      );
      return ok({
        ...access,
        credentials: credentials.map(({ id, label, createdAt }) => ({ id, label, createdAt })),
        recoveryRemaining: count?.count ?? 0,
      });
    });
  }
  mutate(
    actor: PortalActor,
    command: AdministratorSecurityCommand,
  ): Promise<Result<AdministratorSecurityReply>> {
    return atomic(this.db, 'AdministratorSecurity', async (tx) => {
      await requireSecuritySession(tx, actor);
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtextextended(${'administrator-security:' + actor.id},0))`,
      );
      await tx.execute(
        sql`INSERT INTO administrator_security(user_id) VALUES(${actor.id}) ON CONFLICT DO NOTHING`,
      );
      switch (command.action) {
        case 'register-options':
        case 'authenticate-options':
          return startCeremony(tx, actor, command, this.gateway);
        case 'register-finish':
        case 'authenticate-finish':
          return finishCeremony(tx, actor, command, this.gateway);
        default:
          return manageSecurity(tx, actor, command);
      }
    });
  }
}
