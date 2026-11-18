import { z } from 'zod';
import { ADMIN_SECURITY as C } from '../../../config/administrator-security';
import type { AdministratorSecurityCommand } from '../../../core/validation/administrator-security';
const reply = z.object({
  success: z.boolean(),
  code: z.string().optional(),
  data: z
    .object({
      options: z.record(z.string(), z.unknown()).optional(),
      recoveryCodes: z.array(z.string()).optional(),
    })
    .optional(),
});
export class SecurityRequestError extends Error {}
export async function securityRequest(command: AdministratorSecurityCommand) {
  const response = await fetch(C.API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
    cache: 'no-store',
  });
  const parsed = reply.parse(await response.json());
  if (!response.ok || !parsed.success)
    throw new SecurityRequestError(parsed.code === 'MFA_REQUIRED' ? C.FRESH : C.ERROR);
  return parsed.data ?? {};
}
