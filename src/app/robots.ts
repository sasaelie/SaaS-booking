import type { MetadataRoute } from 'next';
import { PUBLIC_SITE } from '../config/public-site';
import { publicSiteSettings } from '../lib/public-site';
export const dynamic = 'force-dynamic';
export default function robots(): MetadataRoute.Robots {
  const { indexable, baseUrl } = publicSiteSettings();
  return indexable && baseUrl
    ? {
        rules: { userAgent: '*', allow: '/', disallow: [...PUBLIC_SITE.PRIVATE_PATHS] },
        sitemap: `${baseUrl}/sitemap.xml`,
      }
    : { rules: { userAgent: '*', disallow: '/' } };
}
