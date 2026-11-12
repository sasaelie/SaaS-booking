import { PUBLIC_DOCUMENTS } from '../../config/public-documents';
import { PublicPage, PublicSections } from '../_marketing/PublicPage';
import { PublicIdentity } from '../_marketing/PublicIdentity';
import { publicMetadata } from '../_marketing/public-metadata';
const page = PUBLIC_DOCUMENTS.legal;
export const dynamic = 'force-dynamic';
export function generateMetadata() {
  return publicMetadata(page.title, page.description, '/mentions-legales');
}
export default function LegalPage() {
  return (
    <PublicPage {...page}>
      <PublicIdentity />
      <PublicSections sections={page.sections} />
    </PublicPage>
  );
}
