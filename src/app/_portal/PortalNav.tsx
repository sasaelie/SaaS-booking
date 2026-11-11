'use client';
import { ADMIN } from '../../config/administration';
import { SESSION_UI } from '../../config/session-details';
import Link from 'next/link';
import { useState, type KeyboardEvent } from 'react';
import { usePathname } from 'next/navigation';
import { PORTAL } from '../../config/constants';
import { APPEARANCE } from '../../config/appearance';
import type { OrganizationSummary } from '../../core/ports/portal-models';
import { IceIcon } from '../_ui/IceIcon';
import { portalReturnTarget } from './navigation-target';
const sections = [
  ['', PORTAL.HOME, 'calendar'],
  ['/activites', PORTAL.ACTIVITIES, 'ticket'],
  ['/reservations', PORTAL.BOOKINGS, 'person'],
  ['/partager', PORTAL.SHARE, 'arrow'],
  ['/parametres', APPEARANCE.TITLE, 'person'],
  ['/reglages', APPEARANCE.SETTINGS, 'calendar'],
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
  const title = navigationTitle(selected, path);
  return (
    <nav
      className="portal-nav"
      aria-label={PORTAL.ORGANIZER}
      data-expanded={expanded}
      onKeyDown={(event) => closeOnEscape(event, expanded, () => setExpanded(false))}
    >
      <MobileBar
        selected={selected}
        path={path}
        title={title}
        expanded={expanded}
        toggle={() => setExpanded(!expanded)}
      />
      <div
        id="organizer-navigation"
        className="portal-nav-links"
        onClick={(event) => {
          if (event.target instanceof Element && event.target.closest('a')) setExpanded(false);
        }}
      >
        {selected ? <OrganizationNav selected={selected} path={path} /> : null}
        <PortalUtilities operator={operator} path={path} />
      </div>
    </nav>
  );
}
function PortalUtilities({
  operator,
  path,
}: {
  readonly operator: boolean;
  readonly path: string;
}) {
  return (
    <div className="portal-nav-utilities">
      <Link href="/app" aria-current={path === '/app' ? 'page' : undefined}>
        {PORTAL.ORGANIZATIONS}
      </Link>
      <Link href="/app/nouveau">{PORTAL.CREATE_ORGANIZATION}</Link>
      {operator ? (
        <Link href="/plateforme" aria-current={path.startsWith('/plateforme') ? 'page' : undefined}>
          {ADMIN.TITLE}
        </Link>
      ) : null}
    </div>
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
    <div className="portal-nav-sections">
      <p className="portal-nav-organization">{selected.name}</p>
      {sections.map(([suffix, label, icon]) => {
        const href = `/app/${selected.id}${suffix}`;
        const active = suffix ? path.startsWith(href) : path === href;
        return (
          <Link key={suffix} href={href} aria-current={active ? 'page' : undefined}>
            <IceIcon name={icon} />
            {label}
          </Link>
        );
      })}
    </div>
  );
}

function MobileBar({
  selected,
  path,
  title,
  expanded,
  toggle,
}: {
  readonly selected: OrganizationSummary | undefined;
  readonly path: string;
  readonly title: string;
  readonly expanded: boolean;
  readonly toggle: () => void;
}) {
  return (
    <div className="portal-mobile-bar">
      <Link
        className="portal-back"
        href={portalReturnTarget(path, selected?.id).href}
        aria-label={portalReturnTarget(path, selected?.id).label}
      >
        ← {APPEARANCE.BACK}
      </Link>
      <span className="portal-current-title">{title}</span>
      <button
        type="button"
        className="portal-menu-toggle"
        aria-controls="organizer-navigation"
        aria-expanded={expanded}
        onClick={toggle}
      >
        {expanded ? PORTAL.CLOSE_MENU : PORTAL.MENU}
      </button>
    </div>
  );
}

function navigationTitle(selected: OrganizationSummary | undefined, path: string) {
  if (selected && path.startsWith(`/app/${selected.id}/seances/`)) return SESSION_UI.TITLE;
  if (path.startsWith('/plateforme')) return ADMIN.TITLE;
  const section = selected
    ? sections.find(([suffix]) =>
        suffix ? path.startsWith(`/app/${selected.id}${suffix}`) : path === `/app/${selected.id}`,
      )
    : null;
  return section?.[1] ?? PORTAL.ORGANIZATIONS;
}

function closeOnEscape(event: KeyboardEvent<HTMLElement>, expanded: boolean, close: () => void) {
  if (event.key !== 'Escape' || !expanded) return;
  close();
  event.currentTarget.querySelector<HTMLButtonElement>('.portal-menu-toggle')?.focus();
}
