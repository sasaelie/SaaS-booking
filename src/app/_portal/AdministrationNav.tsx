'use client';
import { PressableLink as Link } from '../_ui/PressableLink';
import { usePathname } from 'next/navigation';
import { ADMIN } from '../../config/administration';
import { ADMIN_WORKSPACE } from '../../config/administration-workspace';
const tabs = [
  ['/plateforme', ADMIN.OVERVIEW],
  ['/plateforme/finances', ADMIN_WORKSPACE.FINANCE],
  ['/plateforme/utilisation', ADMIN_WORKSPACE.USAGE],
  ['/plateforme/operations', ADMIN.OPERATIONS],
  ['/plateforme/historique', ADMIN.HISTORY],
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
      <nav className="administration-tabs" aria-label={ADMIN.TITLE}>
        {tabs.map(([href, label]) => (
          <Link
            className="liquid-ice-button"
            key={href}
            href={href}
            aria-current={
              (href === '/plateforme' ? path === href : path.startsWith(href)) ? 'page' : undefined
            }
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
