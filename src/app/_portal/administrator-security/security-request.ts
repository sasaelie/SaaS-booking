import { z } from 'zod';
import { ADMIN_SECURITY as C } from '../../../config/administrator-security';
import { ADMIN_CODES } from '../../../config/administrator-codes';
import type { AdministratorSecurityCommand } from '../../../core/validation/administrator-security';
const reply = z.object({
  success: z.boolean(),
  code: z.string().optional(),
  data: z
    .object({
      options: z.record(z.string(), z.unknown()).optional(),
      recoveryCodes: z.array(z.string()).optional(),
      totpSecret: z.string().optional(),
      emailSent: z.boolean().optional(),
      emailNextSendAt: z.string().optional(),
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
  if (!response.ok || !parsed.success) throw new SecurityRequestError(securityMessage(parsed.code));
  return parsed.data ?? {};
}
function securityMessage(code: string | undefined) {
  if (code === 'MFA_REQUIRED') return C.FRESH;
  if (code === 'OTP_INVALID') return ADMIN_CODES.INVALID;
  if (code === 'OTP_LOCKED') return ADMIN_CODES.LOCKED;
  if (code === 'RATE_LIMITED') return ADMIN_CODES.RATE_LIMITED;
  return C.ERROR;
}
