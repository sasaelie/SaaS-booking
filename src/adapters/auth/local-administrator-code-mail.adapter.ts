import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import type { DrizzlePgDb } from '../db/client';
import type { AdministratorCodeMailPort } from '../../core/ports/administrator-codes';
import type { PortalActor } from '../../core/ports/portal-models';
import { ADMIN_CODES as C } from '../../config/administrator-codes';
import { ok } from '../../lib/result';
export class LocalAdministratorCodeMailAdapter implements AdministratorCodeMailPort {
  readonly available = true;
  constructor(private readonly db: DrizzlePgDb) {}
  async send(actor: PortalActor, code: string, _idempotencyKey: string) {
    await this.db.execute(
      sql`INSERT INTO verification(id,identifier,value,"expiresAt") VALUES(${randomUUID()},${'local-administrator-mail:' + actor.id},${code},now()+make_interval(secs=>${C.EMAIL_SECONDS}))`,
    );
    return ok(undefined);
  }
}
