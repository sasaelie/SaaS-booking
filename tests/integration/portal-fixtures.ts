import { sql } from 'drizzle-orm';
import { db } from './database';
import type { PortalActor } from '../../src/core/ports/portal-models';
import { DrizzlePortalRepository } from '../../src/adapters/db/drizzle-portal.repository';
import { required } from '../../src/adapters/db/transaction';
export async function portalFixture(operator = false) {
  const actor: PortalActor = {
    id: crypto.randomUUID(),
    email: `${crypto.randomUUID()}@example.com`,
    name: 'Compte de test',
  };
  await db.execute(
    sql`INSERT INTO "user"(id,name,email,"emailVerified") VALUES(${actor.id},${actor.name},${actor.email},true)`,
  );
  if (operator) await db.execute(sql`INSERT INTO platform_operators(user_id) VALUES(${actor.id})`);
  const repository = new DrizzlePortalRepository(db);
  const organization = required(
    await repository.createOrganization(actor, {
      name: 'Association de test',
      slug: `org-${crypto.randomUUID()}`,
      kind: 'NONPROFIT',
      timezone: 'Europe/Brussels',
    }),
  );
  return { actor, repository, organizationId: organization.organizationId };
}
export function recurringActivity(organizationId: string) {
  return {
    organizationId,
    name: 'Atelier de test',
    description: 'Une activité de démonstration',
    priceCents: 2000,
    audiencePolicy: 'ALL_PUBLIC' as const,
    paymentMode: 'NONE' as const,
    requirePhone: false,
    bookingWindowWeeks: 4,
    noticeHoursForVoucher: 72,
    voucherValidityMonths: 3,
    schedule: {
      kind: 'WEEKLY' as const,
      slots: [{ dayOfWeek: 3, startTimeLocal: '14:00', endTimeLocal: '16:00', capacity: 5 }],
    },
  };
}
