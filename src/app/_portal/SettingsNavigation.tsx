'use client';
import { usePathname } from 'next/navigation';
import { AppLink as Link } from '../_ui/AppLink';
import { WORKSPACE_NAV as UI } from '../../config/workspace-navigation';
export function SettingsNavigation({ organizationId }: { readonly organizationId: string }) {
  const path = usePathname();
  const root = `/app/${organizationId}`;
  return (
    <nav className="portal-inline-links" aria-label={UI.SETTINGS}>
      {(
        [
          ['/reglages', UI.IDENTITY],
          ['/parametres', UI.APPEARANCE],
          ['/reglages#paiements', UI.PAYMENTS],
          ['/abonnement', UI.PLAN],
        ] as const
      ).map(([suffix, label]) => (
        <Link
          key={suffix}
          href={root + suffix}
          aria-current={!suffix?.includes('#') && path === root + suffix ? 'page' : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
