import { AppLink as Link } from '../_ui/AppLink';
import { MARKETING as UI } from '../../config/marketing';
import { publicPlatformProfile } from '../../composition/public-platform-profile';
import { SocialLinks } from '../_ui/SocialLinks';
import { MarketingBrand } from './MarketingHeader';
import { IceIcon } from '../_ui/IceIcon';
export async function MarketingFooter() {
  const profile = await publicPlatformProfile();
  const { email, phone } = profile;
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
            {phone ? (
              <a className="marketing-text-link" href={`tel:${phone}`}>
                {phone}
                <IceIcon name="arrow" />
              </a>
            ) : null}
            <SocialLinks links={profile.socialLinks} />
          </div>
          <FooterNavigation />
        </div>
        <div className="marketing-footer-bottom">
          <p>
            © {new Date().getUTCFullYear()} {UI.BRAND}. {UI.FOOTER_RIGHTS}
          </p>
          {profile.name ? (
            <p>{[profile.name, profile.businessNumber].filter(Boolean).join(' · ')}</p>
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
