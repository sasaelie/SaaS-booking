import { sql } from 'drizzle-orm';
import type { DrizzlePgDb } from './client';
import { atomic } from './transaction';
import type { PortalActor } from '../../core/ports/portal-models';
import type {
  AdministratorCodesRepositoryPort,
  AdministratorOtpPort,
  AdministratorCodeMailPort,
} from '../../core/ports/administrator-codes';
import type { AdministratorSecurityReply } from '../../core/ports/administrator-security';
import type { AdministratorCodeCommand } from '../../core/validation/administrator-codes';
import { ok, type Result } from '../../lib/result';
import { requireSecuritySession } from './administrator-security/access';
import { initializeCodeState } from './administrator-security/code-state';
import { totpCommand } from './administrator-security/totp';
import { sendEmailCode, verifyEmailCode } from './administrator-security/email-code';
import { removeCodeMethod } from './administrator-security/code-removal';
export class DrizzleAdministratorCodesRepository implements AdministratorCodesRepositoryPort {
  readonly mailAvailable: boolean;
  constructor(
    private readonly db: DrizzlePgDb,
    private readonly otp: AdministratorOtpPort,
    private readonly mail: AdministratorCodeMailPort,
  ) {
    this.mailAvailable = mail.available;
  }
  async mutate(
    actor: PortalActor,
    command: AdministratorCodeCommand,
  ): Promise<Result<AdministratorSecurityReply>> {
    const outer = await atomic(this.db, 'AdministratorCodes', async (tx) => {
      await requireSecuritySession(tx, actor);
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtextextended(${'administrator-security:' + actor.id},0))`,
      );
      await tx.execute(
        sql`INSERT INTO administrator_security(user_id) VALUES(${actor.id}) ON CONFLICT DO NOTHING`,
      );
      await initializeCodeState(tx, actor);
      let result: Result<AdministratorSecurityReply>;
      switch (command.action) {
        case 'totp-prepare':
        case 'totp-confirm':
        case 'totp-verify':
          result = await totpCommand(tx, actor, command, this.otp);
          break;
        case 'email-prepare':
        case 'email-send':
          result = await sendEmailCode(tx, actor, command, this.otp, this.mail);
          break;
        case 'email-confirm':
        case 'email-verify':
          result = await verifyEmailCode(tx, actor, command, this.otp);
          break;
        case 'code-remove':
          result = await removeCodeMethod(tx, actor, command.method);
          break;
      }
      // Invalid code attempts must commit their counters; thrown/DB failures still roll back.
      return ok(result);
    });
    return outer.ok ? outer.value : outer;
  }
}
