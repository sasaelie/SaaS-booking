import { SOCIAL_NETWORKS } from '../../../config/service';
import { PlatformPublicProfileSchema } from '../../../core/validation/platform-settings';
export function profileFromForm(form: FormData) {
  return PlatformPublicProfileSchema.safeParse({
    ...Object.fromEntries(
      ['name', 'address', 'businessNumber', 'vatNumber', 'taxStatus', 'email', 'phone'].map(
        (key) => [key, form.get(key) ?? ''],
      ),
    ),
    socialLinks: Object.fromEntries(
      Object.keys(SOCIAL_NETWORKS).map((key) => [key, form.get(`social-${key}`) ?? '']),
    ),
  });
}
