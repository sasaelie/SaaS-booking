import { eq } from 'drizzle-orm';
import type { BrandMediaRepositoryPort, BrandMediaKind } from '../../core/ports/brand-media.port';
import type { PortalActor } from '../../core/ports/portal-models';
import type { DrizzlePgDb } from './client';
import { atomic } from './transaction';
import { organizationBranding } from './schema/saas';
import { requireMembership } from './portal/authorization';
import { enqueue } from './jobs/enqueue';
import { JOB_TYPES, JOB_RULES, TIME, ERROR_CODES } from '../../config/constants';
import { ok } from '../../lib/result';
import { failure } from '../../lib/errors';
export class DrizzleBrandMediaRepository implements BrandMediaRepositoryPort {
  constructor(private readonly db: DrizzlePgDb) {}
  authorize(actor: PortalActor, id: string) {
    return atomic(this.db, 'BrandMedia', async (tx) => {
      await requireMembership(tx, actor, id, true);
      return ok(undefined);
    });
  }
  stage(actor: PortalActor, id: string, key: string) {
    return atomic(this.db, 'BrandMedia', async (tx) => {
      await requireMembership(tx, actor, id, true);
      await enqueue(
        tx,
        id,
        JOB_TYPES.MEDIA_PURGE,
        `brand-orphan:${key}`,
        { organizationId: id, storageKey: key },
        new Date(Date.now() + JOB_RULES.RETRY_MINUTES * TIME.MINUTE_MS),
      );
      return ok(undefined);
    });
  }
  attach(actor: PortalActor, id: string, kind: BrandMediaKind, key: string | null) {
    return atomic(this.db, 'BrandMedia', async (tx) => {
      await requireMembership(tx, actor, id, true);
      const [current] = await tx
        .select()
        .from(organizationBranding)
        .where(eq(organizationBranding.organizationId, id))
        .for('update');
      const previous = kind === 'logo' ? current?.logoStorageKey : current?.backgroundStorageKey;
      const values = kind === 'logo' ? { logoStorageKey: key } : { backgroundStorageKey: key };
      await tx
        .insert(organizationBranding)
        .values({ organizationId: id, ...values })
        .onConflictDoUpdate({ target: organizationBranding.organizationId, set: values });
      if (previous && previous !== key)
        await enqueue(tx, id, JOB_TYPES.MEDIA_PURGE, `brand-replace:${previous}`, {
          organizationId: id,
          storageKey: previous,
        });
      return ok(undefined);
    });
  }
  asset(id: string, kind: BrandMediaKind) {
    return atomic(this.db, 'BrandMedia', async (tx) => {
      const [current] = await tx
        .select()
        .from(organizationBranding)
        .where(eq(organizationBranding.organizationId, id));
      const key = kind === 'logo' ? current?.logoStorageKey : current?.backgroundStorageKey;
      return key ? ok(key) : failure(ERROR_CODES.NOT_FOUND, 'BrandMedia', 'asset');
    });
  }
}
