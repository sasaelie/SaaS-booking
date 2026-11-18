import { headers } from 'next/headers';
import { SECURITY } from '../../config/security';
import { MARKETING } from '../../config/marketing';
import { publicSiteSettings } from '../../lib/public-site';
export async function PublicStructuredData() {
  const { baseUrl, indexable } = publicSiteSettings();
  if (!indexable || !baseUrl) return null;
  const nonce = (await headers()).get(SECURITY.NONCE_HEADER) ?? undefined;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: MARKETING.BRAND,
    url: baseUrl,
    description: MARKETING.DESCRIPTION,
    inLanguage: 'fr-BE',
  };
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
