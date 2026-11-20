import { z } from 'zod';
export const DeviceRegistrationOptionsSchema = z
  .object({
    challenge: z.string().min(1),
    rp: z.object({ name: z.string(), id: z.string().optional() }),
    user: z.object({ id: z.string(), name: z.string(), displayName: z.string() }),
    pubKeyCredParams: z.array(z.object({ type: z.literal('public-key'), alg: z.number().int() })),
  })
  .passthrough();
export const DeviceAuthenticationOptionsSchema = z
  .object({ challenge: z.string().min(1) })
  .passthrough();
