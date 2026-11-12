import { PUBLIC_DOCUMENTS } from '../../config/public-documents';
import { PublicPage, PublicSections } from '../_marketing/PublicPage';
import { publicMetadata } from '../_marketing/public-metadata';
const page = PUBLIC_DOCUMENTS.privacy;
export const dynamic = 'force-dynamic';
export function generateMetadata() {
  return publicMetadata(page.title, page.description, '/confidentialite');
}
export default function PrivacyPage() {
  return (
    <PublicPage {...page}>
      <PublicSections sections={page.sections} />
    </PublicPage>
  );
}
