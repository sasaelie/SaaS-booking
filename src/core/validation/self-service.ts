import { z } from 'zod';
import { INPUT_LIMITS } from '../../config/constants';
export const SelfCancelPayloadSchema = z
  .object({
    organizationId: z.uuid(),
    bookingId: z.uuid(),
    version: z.number().int().nonnegative(),
    expUnixSeconds: z.number().int().positive(),
  })
  .strict();
export type SelfCancelTokenPayload = z.infer<typeof SelfCancelPayloadSchema>;
export const SelfCancelTokenSchema = z.string().min(1).max(INPUT_LIMITS.TOKEN_MAX);
