import { z } from 'zod';
import { PUBLIC_SITE, PublicIdentitySchema, PublicUrlSchema } from '../config/public-site';
type PublicEnvironment = Readonly<Record<string, string | undefined>>;
export function publicSiteSettings(input: PublicEnvironment = process.env) {
  const identity = PublicIdentitySchema.safeParse(input);
  const url = PublicUrlSchema.safeParse(input['PUBLIC_SITE_URL']);
  const email = z.email().safeParse(input['PUBLIC_CONTACT_EMAIL']);
  const applicationUrl = z.url().safeParse(input['NEXT_PUBLIC_APP_URL']);
  const indexable =
    input['APP_ENVIRONMENT'] === PUBLIC_SITE.PRODUCTION &&
    (!input['VERCEL_ENV'] || input['VERCEL_ENV'] === PUBLIC_SITE.PRODUCTION) &&
    input['SEARCH_INDEXING_ENABLED'] === PUBLIC_SITE.ENABLED &&
    identity.success &&
    url.success;
  return {
    indexable,
    identity: identity.success ? identity.data : null,
    baseUrl: url.success ? new URL(url.data).origin : null,
    email: email.success ? email.data : null,
    applicationUrl: applicationUrl.success ? applicationUrl.data : null,
  };
}
export function isMarketingPath(path: string) {
  return PUBLIC_SITE.PATHS.some((publicPath) => path === publicPath);
}
export function isPublicSearchPath(path: string) {
  return isMarketingPath(path) || PUBLIC_SITE.ASSET_PATHS.some((assetPath) => path === assetPath);
}
