import { eq } from 'drizzle-orm';
import { organizations } from '../schema';
import { organizationBranding } from '../schema/saas';
import type { Transaction } from '../transaction';
import { requireMembership } from './authorization';
import type { PortalActor } from '../../../core/ports/portal-models';
import type { OrganizationSettingsInput } from '../../../core/ports/portal-inputs';
import { ok } from '../../../lib/result';
export async function updateSettings(
  tx: Transaction,
  actor: PortalActor,
  input: OrganizationSettingsInput,
) {
  await requireMembership(tx, actor, input.organizationId, true);
  await tx
    .update(organizations)
    .set({
      name: input.name,
      bankIban: input.bankIban,
      bankAccountName: input.bankAccountName,
      autoDeleteBankProof: input.autoDeleteBankProof,
    })
    .where(eq(organizations.id, input.organizationId));
  await tx
    .insert(organizationBranding)
    .values({ organizationId: input.organizationId, theme: input.theme })
    .onConflictDoUpdate({
      target: organizationBranding.organizationId,
      set: { theme: input.theme },
    });
  return ok(undefined);
}
