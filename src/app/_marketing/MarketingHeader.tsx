import Link from 'next/link';
import { MARKETING as UI } from '../../config/marketing';
import { IceIcon } from '../_ui/IceIcon';
export function MarketingBrand() {
  return (
    <Link className="marketing-brand" href="/">
      <span className="marketing-brand-mark" aria-hidden="true">
        <IceIcon name="calendar" />
      </span>
      <span>
        {UI.BRAND}
        <small>{UI.CATEGORY}</small>
      </span>
    </Link>
  );
}
export function MarketingHeader({ connected = false }: { readonly connected?: boolean }) {
  return (
    <>
      <Link className="marketing-skip" href="#contenu">
        {UI.SKIP}
      </Link>
      <header className="marketing-header">
        <div className="marketing-container marketing-header-inner">
          <MarketingBrand />
          <nav className="marketing-nav" aria-label={UI.NAV_LABEL}>
            {UI.NAV.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          <nav className="marketing-account" aria-label={UI.ACCOUNT_LABEL}>
            <Link className="marketing-account-link" href={connected ? '/app' : '/connexion'}>
              {connected ? UI.SPACES : UI.LOGIN}
              <IceIcon name="next" />
            </Link>
            {!connected ? (
              <Link
                className="liquid-ice-button portal-button marketing-header-cta"
                href="/inscription"
              >
                {UI.SIGNUP}
              </Link>
            ) : null}
          </nav>
        </div>
      </header>
    </>
  );
}
