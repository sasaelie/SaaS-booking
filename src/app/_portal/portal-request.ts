import { PortalResponseSchema, portalError } from './portal-response';
import { AdminResponseSchema } from './admin-response';
export async function portalRequest(command: unknown) {
  const response = await fetch('/api/portal/command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  const raw: unknown = await response.json();
  const parsed = PortalResponseSchema.safeParse(raw);
  if (!parsed.success || !parsed.data.success)
    return { error: portalError(parsed.success ? parsed.data.code : undefined) };
  return { data: parsed.data.data };
}
export async function adminRequest(command: unknown) {
  const response = await fetch('/api/portal/manage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  const raw: unknown = await response.json();
  const parsed = AdminResponseSchema.safeParse(raw);
  if (!parsed.success || !parsed.data.success)
    return { error: portalError(parsed.success ? parsed.data.code : undefined) };
  return { data: parsed.data.data };
}
