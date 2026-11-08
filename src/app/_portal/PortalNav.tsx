'use client';
import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { PORTAL } from '../../config/constants';
import type { OrganizationSummary } from '../../core/ports/portal-models';
import { IceIcon } from '../_ui/IceIcon';
const sections = [
  ['', PORTAL.HOME, 'calendar'],
  ['/activites', PORTAL.ACTIVITIES, 'ticket'],
  ['/reservations', PORTAL.BOOKINGS, 'person'],
  ['/partager', PORTAL.SHARE, 'arrow'],
  ['/parametres', PORTAL.SETTINGS, 'person'],
  ['/abonnement', PORTAL.BILLING, 'lock'],
] as const;
export function PortalNav({
  organizations,
  operator,
}: {
  readonly organizations: readonly OrganizationSummary[];
  readonly operator: boolean;
}) {
  const path = usePathname();
  const [expanded, setExpanded] = useState(false);
  const selected = organizations.find((org) => path.startsWith(`/app/${org.id}`));
  return (
    <nav
      className="portal-nav"
      aria-label={PORTAL.ORGANIZER}
      data-expanded={expanded}
      onClick={(event) => {
        if (event.target instanceof Element && event.target.closest('a')) setExpanded(false);
      }}
    >
      <button
        type="button"
        className="portal-menu-toggle"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
      >
        {expanded ? PORTAL.CLOSE_MENU : PORTAL.MENU}
      </button>
      <Link
        href="/app"
        className="portal-nav-global"
        aria-current={path === '/app' ? 'page' : undefined}
      >
        {PORTAL.ORGANIZATIONS}
      </Link>
      {selected ? <OrganizationNav selected={selected} path={path} /> : null}
      <Link href="/app/nouveau">{PORTAL.CREATE_ORGANIZATION}</Link>
      {operator ? <PlatformNavLink path={path} /> : null}
    </nav>
  );
}

function OrganizationNav({
  selected,
  path,
}: {
  readonly selected: OrganizationSummary;
  readonly path: string;
}) {
  return (
    <>
      <p className="portal-nav-organization">{selected.name}</p>
      {sections.map(([suffix, label, icon]) => {
        const href = `/app/${selected.id}${suffix}`;
        return (
          <Link key={suffix} href={href} aria-current={path === href ? 'page' : undefined}>
            <IceIcon name={icon} />
            {label}
          </Link>
        );
      })}
    </>
  );
}

function PlatformNavLink({ path }: { readonly path: string }) {
  return (
    <Link
      className="portal-nav-platform"
      href="/plateforme"
      aria-current={path.startsWith('/plateforme') ? 'page' : undefined}
    >
      <IceIcon name="lock" />
      {PORTAL.PLATFORM}
    </Link>
  );
}
