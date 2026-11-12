import { PUBLIC_DOCUMENTS } from '../../config/public-documents';
import { PublicPage, PublicSections } from '../_marketing/PublicPage';
import { publicMetadata } from '../_marketing/public-metadata';
const page = PUBLIC_DOCUMENTS.terms;
export const dynamic = 'force-dynamic';
export function generateMetadata() {
  return publicMetadata(page.title, page.description, '/conditions');
}
export default function TermsPage() {
  return (
    <PublicPage {...page}>
      <PublicSections sections={page.sections} />
    </PublicPage>
  );
}
