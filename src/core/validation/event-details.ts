import { z } from 'zod';
import { SERVICE, SOCIAL_NETWORKS } from '../../config/service';
const safeUrl = z
  .string()
  .trim()
  .max(SERVICE.URL_MAX)
  .refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !url.username && !url.password;
    } catch {
      return false;
    }
  });
export const SocialLinksSchema = z.partialRecord(
  z.enum(
    Object.keys(SOCIAL_NETWORKS) as [
      keyof typeof SOCIAL_NETWORKS,
      ...(keyof typeof SOCIAL_NETWORKS)[],
    ],
  ),
  safeUrl,
);
export const EventDetailsSchema = z.object({
  address: z.string().trim().max(SERVICE.TEXT_MAX).default(''),
  addressVisibility: z.enum(['PUBLIC', 'REMINDER']).default('PUBLIC'),
  practicalInfo: z.string().trim().max(SERVICE.TEXT_MAX).default(''),
  participationTerms: z.string().trim().max(SERVICE.TEXT_MAX).default(''),
});
