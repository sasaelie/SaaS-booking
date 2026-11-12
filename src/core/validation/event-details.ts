import { ContactPhoneSchema } from './contact-phone';
import { z } from 'zod';
import { SERVICE } from '../../config/service';
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
export const SocialLinksSchema = z
  .object({
    whatsapp: safeUrl.optional(),
    facebook: safeUrl.optional(),
    instagram: safeUrl.optional(),
    youtube: safeUrl.optional(),
    tiktok: safeUrl.optional(),
    website: safeUrl.optional(),
    phone: ContactPhoneSchema.optional(),
  })
  .strict();
export const EventDetailsSchema = z.object({
  address: z.string().trim().max(SERVICE.TEXT_MAX).default(''),
  addressVisibility: z.enum(['PUBLIC', 'REMINDER']).default('PUBLIC'),
  practicalInfo: z.string().trim().max(SERVICE.TEXT_MAX).default(''),
  participationTerms: z.string().trim().max(SERVICE.TEXT_MAX).default(''),
});
