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
import type { AdministratorCodesRepositoryPort } from '../../core/ports/administrator-codes';
import { isAdministratorCodeCommand } from '../../core/validation/administrator-codes';
import { codeFactorState } from './administrator-security/code-state';
import { failure } from '../../lib/errors';
import { ERROR_CODES } from '../../config/constants';
export class DrizzleAdministratorSecurityRepository implements AdministratorSecurityRepositoryPort {
  constructor(
    private readonly db: DrizzlePgDb,
    private readonly gateway: PasskeyGatewayPort,
    private readonly codes?: AdministratorCodesRepositoryPort,
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
        contextKey: actor.sessionId ?? actor.id,
        ...access,
        ...(await codeFactorState(tx, actor)),
        emailAvailable: this.codes?.mailAvailable ?? false,
        emailAddress: actor.email,
        credentials: credentials.map(({ id, label, createdAt }) => ({ id, label, createdAt })),
        recoveryRemaining: count?.count ?? 0,
      });
    });
  }
  mutate(
    actor: PortalActor,
    command: AdministratorSecurityCommand,
  ): Promise<Result<AdministratorSecurityReply>> {
    if (isAdministratorCodeCommand(command))
      return (
        this.codes?.mutate(actor, command) ??
        Promise.resolve(
          failure(ERROR_CODES.CONFIGURATION_ERROR, 'AdministratorCodes', 'configuration'),
        )
      );
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
