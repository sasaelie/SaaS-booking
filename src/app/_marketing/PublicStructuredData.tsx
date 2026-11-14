import { MARKETING } from '../../config/marketing';
import { publicSiteSettings } from '../../lib/public-site';
export function PublicStructuredData() {
  const { baseUrl, indexable } = publicSiteSettings();
  if (!indexable || !baseUrl) return null;
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}
