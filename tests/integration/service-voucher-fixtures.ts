import { db } from './database';
import { sql } from 'drizzle-orm';
import { DrizzlePortalRepository } from '../../src/adapters/db/drizzle-portal.repository';
export async function ownerOf(organizationId: string) {
  const actor = {
    id: crypto.randomUUID(),
    name: 'Organisateur de test',
    email: `${crypto.randomUUID()}@example.com`,
  };
  await db.execute(
    sql`INSERT INTO "user"(id,name,email,"emailVerified") VALUES(${actor.id},${actor.name},${actor.email},true)`,
  );
  await db.execute(
    sql`INSERT INTO organization_members(organization_id,user_id,role) VALUES(${organizationId},${actor.id},'OWNER')`,
  );
  return { actor, repository: new DrizzlePortalRepository(db) };
}
