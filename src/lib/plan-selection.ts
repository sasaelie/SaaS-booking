import { PlanIntentSchema, type PlanIntent } from '../core/validation/plan-selection';
import { MEMBER_ROLES } from '../config/constants';
export function readPlanIntent(raw: unknown): PlanIntent | null {
  const parsed = PlanIntentSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
export function planPath(path: string, plan: PlanIntent | null) {
  return plan ? `${path}?formule=${plan}` : path;
}
export function afterOrganizationCreation(id: string, plan: PlanIntent | null) {
  return plan === 'pro' ? planPath(`/app/${id}/abonnement`, plan) : `/app/${id}`;
}
export function planEntryDestination(
  organizations: readonly { readonly id: string; readonly role: string }[],
  plan: PlanIntent,
) {
  const owned = organizations.filter((organization) => organization.role === MEMBER_ROLES.OWNER);
  if (!owned.length) return planPath('/app/nouveau', plan);
  return owned.length === 1 && owned[0] ? planPath(`/app/${owned[0].id}/abonnement`, plan) : null;
}
