import Link from 'next/link';
import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import { currentVisitor } from '../../composition/current-visitor';
import { PUBLIC_DOCUMENT_UI as UI } from '../../config/public-documents';
import { publicSiteSettings } from '../../lib/public-site';
import { IceIcon } from '../_ui/IceIcon';
import { MarketingHeader } from './MarketingHeader';
import { MarketingFooter } from './MarketingFooter';
import './marketing.css';
export async function PublicPage({
  title,
  description,
  children,
  showPublicationNotice = true,
}: {
  readonly title: string;
  readonly description: string;
  readonly children: ReactNode;
  readonly showPublicationNotice?: boolean;
}) {
  const actor = await currentVisitor(new Headers(await headers()));
  return (
    <div className="marketing-root">
      <MarketingHeader connected={actor !== null} />
      <main
        className="marketing-main marketing-document marketing-container"
        id="contenu"
        tabIndex={-1}
      >
        <Link className="marketing-text-link" href="/">
          <IceIcon name="back" />
          {UI.BACK}
        </Link>
        <h1>{title}</h1>
        <p className="marketing-intro">{description}</p>
        {showPublicationNotice ? <PublicationNotice /> : null}
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}
function PublicationNotice() {
  return !publicSiteSettings().identity ? (
    <p className="marketing-document-notice" role="note">
      {UI.INCOMPLETE}
    </p>
  ) : null;
}
export function PublicSections({
  sections,
}: {
  readonly sections: readonly { readonly title: string; readonly text: string }[];
}) {
  return (
    <div className="marketing-document-sections">
      {sections.map((section) => (
        <section key={section.title}>
          <h2>{section.title}</h2>
          <p>{section.text}</p>
        </section>
      ))}
    </div>
  );
}
