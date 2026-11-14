import type { MetadataRoute } from 'next';
import { PUBLIC_SITE } from '../config/public-site';
import { publicSiteSettings } from '../lib/public-site';
export const dynamic = 'force-dynamic';
export default function sitemap(): MetadataRoute.Sitemap {
  const { indexable, baseUrl } = publicSiteSettings();
  return indexable && baseUrl
    ? PUBLIC_SITE.PATHS.map((path) => ({ url: `${baseUrl}${path}` }))
    : [];
}
