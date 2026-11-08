import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { organizationBranding } from '../db/schema/saas';
import type { DrizzlePgDb } from '../db/client';
import type { PrivateProofStoragePort } from '../../core/ports/bank.port';
import { ok } from '../../lib/result';
const BrandPurgeSchema = z.object({ organizationId: z.uuid(), storageKey: z.string().min(1) });
export async function purgeBrand(db: DrizzlePgDb, storage: PrivateProofStoragePort, raw: unknown) {
  const payload = BrandPurgeSchema.parse(raw);
  if (!payload.storageKey.startsWith(`org_${payload.organizationId}/branding/`))
    throw Error('Invalid media scope');
  const [current] = await db
    .select()
    .from(organizationBranding)
    .where(eq(organizationBranding.organizationId, payload.organizationId));
  if (
    current?.logoStorageKey === payload.storageKey ||
    current?.backgroundStorageKey === payload.storageKey
  )
    return ok({ preserveProof: true as const });
  const result = await storage.deleteProofImmediately(payload.storageKey);
  return result.ok ? ok({}) : result;
}
