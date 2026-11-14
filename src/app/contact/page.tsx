import Link from 'next/link';
import { PUBLIC_DOCUMENT_UI as UI } from '../../config/public-documents';
import { publicProfile } from '../../lib/public-profile';
import { PublicPage } from '../_marketing/PublicPage';
import { publicMetadata } from '../_marketing/public-metadata';
import { IceIcon } from '../_ui/IceIcon';
import { PublicContactDetails } from '../_marketing/PublicIdentity';
export const dynamic = 'force-dynamic';
export function generateMetadata() {
  return publicMetadata(UI.CONTACT_TITLE, UI.CONTACT_DESCRIPTION, '/contact');
}
function ContactMethods() {
  const { email, phone } = publicProfile();
  return (
    <section className="portal-panel marketing-document-identity">
      <h2>{UI.CONTACT_DIRECT}</h2>
      <PublicContactDetails />
      {!email && !phone ? <p>{UI.CONTACT_PENDING}</p> : null}
    </section>
  );
}
export default function ContactPage() {
  return (
    <PublicPage title={UI.CONTACT_TITLE} description={UI.CONTACT_DESCRIPTION}>
      <ContactMethods />
      <section>
        <h2>{UI.CONTACT_PARTICIPANT}</h2>
        <p>{UI.CONTACT_PARTICIPANT_TEXT}</p>
      </section>
      <section>
        <h2>{UI.CONTACT_ORGANIZER}</h2>
        <p>{UI.CONTACT_ORGANIZER_TEXT}</p>
        <div className="marketing-contact-links">
          <Link className="marketing-text-link" href="/faq">
            {UI.CONTACT_FAQ}
            <IceIcon name="arrow" />
          </Link>
          <Link className="marketing-text-link" href="/#tarifs">
            {UI.CONTACT_PRICING}
            <IceIcon name="arrow" />
          </Link>
        </div>
      </section>
    </PublicPage>
  );
}
