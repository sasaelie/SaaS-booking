import { z } from 'zod';
export const AdminResponseSchema = z.object({
  success: z.boolean(),
  code: z.string().optional(),
  data: z
    .object({
      status: z.string().optional(),
      sessionStartsAt: z.iso.datetime().optional(),
      affectedBookingsCount: z.number().int().optional(),
      confirmationHash: z.string().optional(),
      presignedUrl: z
        .url()
        .refine((value) => /^https?:\/\//.test(value))
        .optional(),
    })
    .optional(),
});
