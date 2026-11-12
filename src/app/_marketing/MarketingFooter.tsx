import Link from 'next/link';
import { MARKETING as UI } from '../../config/marketing';
import { publicSiteSettings } from '../../lib/public-site';
import { MarketingBrand } from './MarketingHeader';
import { IceIcon } from '../_ui/IceIcon';
export function MarketingFooter() {
  const { identity, email } = publicSiteSettings();
  return (
    <footer className="marketing-footer">
      <div className="marketing-container">
        <div className="marketing-footer-grid">
          <div>
            <MarketingBrand />
            <p>{UI.FOOTER_DESCRIPTION}</p>
            {email ? (
              <a className="marketing-text-link" href={`mailto:${email}`}>
                {email}
                <IceIcon name="arrow" />
              </a>
            ) : null}
          </div>
          <FooterNavigation />
        </div>
        <div className="marketing-footer-bottom">
          <p>
            © {new Date().getUTCFullYear()} {UI.BRAND}. {UI.FOOTER_RIGHTS}
          </p>
          {identity ? (
            <p>
              {identity.PUBLIC_LEGAL_NAME} · {identity.PUBLIC_BUSINESS_NUMBER}
            </p>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
function FooterNavigation() {
  return (
    <>
      <nav aria-label={UI.FOOTER_PRODUCT}>
        <h2>{UI.FOOTER_PRODUCT}</h2>
        {UI.NAV.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
            <IceIcon name="next" />
          </Link>
        ))}
      </nav>
      <nav aria-label={UI.FOOTER_LABEL}>
        <h2>{UI.FOOTER_LEGAL}</h2>
        {UI.FOOTER_LINKS.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
            <IceIcon name="next" />
          </Link>
        ))}
      </nav>
    </>
  );
}
