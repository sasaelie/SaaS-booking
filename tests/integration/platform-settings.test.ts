import { expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { db } from './database';
import { portalFixture } from './portal-fixtures';
import { required, rows } from '../../src/adapters/db/transaction';
import { DrizzlePlatformSettingsRepository } from '../../src/adapters/db/drizzle-platform-settings.repository';
import { PlatformPublicProfileSchema } from '../../src/core/validation/platform-settings';
const profile = PlatformPublicProfileSchema.parse({
  name: 'Entreprise fictive',
  email: 'public@example.invalid',
  phone: '0470 12 34 56',
  socialLinks: { website: 'https://example.invalid' },
});
it('keeps drafts and connection metadata private, publishes only a snapshot and retracts it without exposing a newer draft', async () => {
  const { actor } = await portalFixture(true);
  const repository = new DrizzlePlatformSettingsRepository(db);
  required(await repository.mutate(actor, { action: 'save', revision: 0, profile }));
  expect(required(await repository.publicProfile())).toEqual({
    mode: 'ENVIRONMENT',
    profile: null,
  });
  required(await repository.mutate(actor, { action: 'publish', revision: 1 }));
  expect(required(await repository.publicProfile()).profile?.email).toBe(profile.email);
  required(
    await repository.mutate(actor, {
      action: 'save',
      revision: 2,
      profile: { ...profile, email: 'private-draft@example.invalid' },
    }),
  );
  required(
    await repository.mutate(actor, {
      action: 'connection',
      revision: 3,
      connection: { provider: 'BILLIT', participantId: '0208:0123456789' },
    }),
  );
  const publicData = required(await repository.publicProfile());
  expect(publicData.profile?.email).toBe(profile.email);
  expect(JSON.stringify(publicData)).not.toMatch(/private-draft|BILLIT|0208/);
  required(await repository.mutate(actor, { action: 'unpublish', revision: 4 }));
  expect(required(await repository.publicProfile())).toEqual({ mode: 'HIDDEN', profile: null });
  expect(required(await repository.read(actor)).draft.email).toBe('private-draft@example.invalid');
});
it('refuses ordinary organizers, revokes access immediately and never accepts a stale revision', async () => {
  const admin = await portalFixture(true),
    ordinary = await portalFixture();
  const repository = new DrizzlePlatformSettingsRepository(db);
  expect((await repository.read(ordinary.actor)).ok).toBe(false);
  expect(
    (await repository.mutate(ordinary.actor, { action: 'save', revision: 0, profile })).ok,
  ).toBe(false);
  required(await repository.mutate(admin.actor, { action: 'save', revision: 0, profile }));
  const stale = await repository.mutate(admin.actor, { action: 'publish', revision: 0 });
  expect(stale.ok ? null : stale.error.code).toBe('CONFLICT');
  await db.execute(sql`DELETE FROM platform_operators WHERE user_id=${admin.actor.id}`);
  expect((await repository.mutate(admin.actor, { action: 'publish', revision: 1 })).ok).toBe(false);
  expect(required(await repository.publicProfile()).profile).toBeNull();
});
it('serializes simultaneous first saves so exactly one version wins and the other cannot overwrite it', async () => {
  const { actor } = await portalFixture(true);
  const repository = new DrizzlePlatformSettingsRepository(db);
  const results = await Promise.all(
    ['one@example.invalid', 'two@example.invalid'].map((email) =>
      repository.mutate(actor, { action: 'save', revision: 0, profile: { ...profile, email } }),
    ),
  );
  expect(results.filter((result) => result.ok)).toHaveLength(1);
  expect(results.filter((result) => !result.ok && result.error.code === 'CONFLICT')).toHaveLength(
    1,
  );
  const audit = await rows<{ count: number }>(
    db,
    sql`SELECT count(*)::int AS count FROM platform_audit WHERE action='PLATFORM_PROFILE_DRAFT_SAVED'`,
  );
  expect(audit[0]?.count).toBe(1);
});
it('keeps the platform configuration table behind RLS with no PUBLIC table privileges', async () => {
  const result = await rows<{ rls: boolean; public_access: boolean }>(
    db,
    sql`SELECT c.relrowsecurity AS rls,EXISTS(SELECT 1 FROM aclexplode(COALESCE(c.relacl,acldefault('r',c.relowner))) a WHERE a.grantee=0 AND a.privilege_type IN ('SELECT','INSERT','UPDATE','DELETE')) AS public_access FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=current_schema() AND c.relname='platform_settings'`,
  );
  expect(result).toEqual([{ rls: true, public_access: false }]);
});
