import { organizationAccess } from '../src/adapters/db/schema/saas';
import { eq } from 'drizzle-orm';
import { createDatabase } from '../src/adapters/db/client';
import { organizations, activities, timeSlots } from '../src/adapters/db/schema';
import { AUDIENCE_POLICIES, PAYMENT_MODES, TIME } from '../src/config/constants';
type Database = ReturnType<typeof createDatabase>['db'];
async function demoOrganization(db: Database) {
  const [row] = await db
    .insert(organizations)
    .values({
      name: 'Studio Créatif 360 — Démonstration',
      slug: 'studio-demo',
      timezone: 'Europe/Brussels',
    })
    .onConflictDoUpdate({
      target: organizations.slug,
      set: { name: 'Studio Créatif 360 — Démonstration' },
    })
    .returning();
  if (!row) throw Error('Organization missing');
  return row;
}
async function demoActivity(db: Database, organizationId: string) {
  let [row] = await db
    .select()
    .from(activities)
    .where(eq(activities.organizationId, organizationId));
  if (!row)
    [row] = await db
      .insert(activities)
      .values({
        organizationId,
        name: 'Couture débutants — Enfants',
        priceCents: 2000,
        paymentMode: PAYMENT_MODES.NONE,
        audiencePolicy: AUDIENCE_POLICIES.MINORS_ONLY,
        requirePhone: true,
      })
      .returning();
  if (!row) throw Error('Activity missing');
  return row;
}
async function seed(): Promise<void> {
  if (process.env['ALLOW_DEMO_SEED'] !== 'true') throw Error('Set ALLOW_DEMO_SEED=true explicitly');
  const url = process.env['DATABASE_URL'];
  if (!url) throw Error('DATABASE_URL required');
  const { db, pool } = createDatabase(url, process.env['DATABASE_SCHEMA']);
  try {
    const organization = await demoOrganization(db);
    const activity = await demoActivity(db, organization.id);
    await db
      .insert(organizationAccess)
      .values({ organizationId: organization.id, complimentary: true })
      .onConflictDoNothing();
    for (let dayOfWeek = 0; dayOfWeek < TIME.DAYS_PER_WEEK; dayOfWeek++)
      await db
        .insert(timeSlots)
        .values({
          organizationId: organization.id,
          activityId: activity.id,
          dayOfWeek,
          startTimeLocal: '14:00',
          endTimeLocal: '16:00',
          capacity: 5,
        })
        .onConflictDoNothing();
    console.info(`/${organization.slug}/${activity.id}`);
  } finally {
    await pool.end();
  }
}
void seed().catch(() => {
  console.error('Demo seed failed');
  process.exitCode = 1;
});
