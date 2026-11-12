import type { Metadata } from 'next';
import { MARKETING } from '../../config/marketing';
import { publicSiteSettings } from '../../lib/public-site';
export function publicMetadata(title: string, description: string, path = '/'): Metadata {
  const { indexable, baseUrl, applicationUrl } = publicSiteSettings();
  const url = baseUrl ? `${baseUrl}${path}` : undefined;
  const metadataBase = baseUrl ?? applicationUrl;
  return {
    metadataBase: metadataBase ? new URL(metadataBase) : undefined,
    title: `${title} | ${MARKETING.BRAND}`,
    description,
    robots: { index: indexable, follow: indexable },
    alternates: url ? { canonical: url } : undefined,
    openGraph: {
      type: 'website',
      locale: 'fr_BE',
      siteName: MARKETING.BRAND,
      title,
      description,
      url,
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}
