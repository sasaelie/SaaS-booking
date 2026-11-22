'use client';
import { PressableLink as Link } from '../_ui/PressableLink';
import { usePathname } from 'next/navigation';
import { PLATFORM_SETTINGS } from '../../config/platform-settings';
import { AdministrationTabStrip } from './AdministrationTabStrip';
import { ADMIN } from '../../config/administration';
import { ADMIN_WORKSPACE } from '../../config/administration-workspace';
import { WORKSPACE_NAV as UI } from '../../config/workspace-navigation';
const tabs = [
  ['/plateforme', ADMIN.OVERVIEW],
  ['/plateforme/finances', ADMIN_WORKSPACE.FINANCE],
  ['/plateforme/utilisation', ADMIN_WORKSPACE.USAGE],
  ['/plateforme/operations', UI.TRACKING],
  ['/plateforme/parametres', PLATFORM_SETTINGS.NAV],
] as const;
export function AdministrationNav() {
  const path = usePathname();
  return (
    <div className="administration-navigation">
      <Link
        href="/app"
        className={
          path === '/plateforme'
            ? 'administration-back administration-back-mobile-duplicate'
            : 'administration-back'
        }
      >
        ← {ADMIN.BACK}
      </Link>
      <AdministrationTabStrip label={ADMIN.TITLE} activeKey={path}>
        {tabs.map(([href, label]) => (
          <Link
            className="liquid-ice-button"
            key={href}
            href={href}
            aria-current={activeTab(path, href) ? 'page' : undefined}
          >
            {label}
          </Link>
        ))}
      </AdministrationTabStrip>
      <TrackingNavigation path={path} />
    </div>
  );
}

function activeTab(path: string, href: string) {
  if (href === '/plateforme') return path === href;
  if (href === '/plateforme/operations')
    return ['/plateforme/operations', '/plateforme/historique'].includes(path);
  return path.startsWith(href);
}
function TrackingNavigation({ path }: { readonly path: string }) {
  return (
    <>
      {['/plateforme/operations', '/plateforme/historique'].includes(path) ? (
        <nav className="portal-inline-links" aria-label={UI.TRACKING}>
          <Link
            href="/plateforme/operations"
            aria-current={path === '/plateforme/operations' ? 'page' : undefined}
          >
            {UI.OPERATIONS}
          </Link>
          <Link
            href="/plateforme/historique"
            aria-current={path === '/plateforme/historique' ? 'page' : undefined}
          >
            {UI.HISTORY}
          </Link>
        </nav>
      ) : null}
    </>
  );
}
