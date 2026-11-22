import { z } from 'zod';
export const CancellationPreviewSchema = z.object({
  eligible: z.boolean(),
  valueCents: z.number().int().nonnegative(),
  expiresAt: z.iso.datetime().nullable(),
  currency: z.string(),
  paidValueCents: z.number().int().nonnegative(),
});
export type CancellationPreview = z.infer<typeof CancellationPreviewSchema>;
