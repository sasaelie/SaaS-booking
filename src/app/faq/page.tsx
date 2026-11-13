import { MARKETING as UI } from '../../config/marketing';
import { PublicPage } from '../_marketing/PublicPage';
import { publicMetadata } from '../_marketing/public-metadata';
import { MarketingFaq } from '../_marketing/MarketingFaq';
export const dynamic = 'force-dynamic';
export function generateMetadata() {
  return publicMetadata(UI.FAQ_PAGE_TITLE, UI.FAQ_PAGE_DESCRIPTION, '/faq');
}
export default function FaqPage() {
  return (
    <PublicPage
      title={UI.FAQ_PAGE_TITLE}
      description={UI.FAQ_PAGE_DESCRIPTION}
      showPublicationNotice={false}
    >
      <MarketingFaq />
    </PublicPage>
  );
}
