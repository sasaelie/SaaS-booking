import { z } from 'zod';
import { EMBED_HEALTH } from '../../config/embed-health';
export const EmbedReadySchema = z
  .object({
    type: z.literal(EMBED_HEALTH.READY),
    version: z.literal(EMBED_HEALTH.VERSION),
    status: z.enum(['ready', 'unavailable']),
  })
  .strict();
export type EmbedReady = z.infer<typeof EmbedReadySchema>;
export const EmbedPingSchema = z
  .object({
    type: z.literal(EMBED_HEALTH.PING),
    version: z.literal(EMBED_HEALTH.VERSION),
  })
  .strict();
export const EmbedCheckUrlSchema = z.url().pipe(
  z.string().refine((value) => {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  }, EMBED_HEALTH.SITE_INVALID),
);
