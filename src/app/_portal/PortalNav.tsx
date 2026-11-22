'use client';
import { ADMIN } from '../../config/administration';
import { ADMIN_SECURITY } from '../../config/administrator-security';
import { SESSION_UI } from '../../config/session-details';
import { AppLink as Link } from '../_ui/AppLink';
import { useState, type KeyboardEvent, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { PORTAL } from '../../config/constants';
import { APPEARANCE } from '../../config/appearance';
import type { OrganizationSummary } from '../../core/ports/portal-models';
import { IceIcon } from '../_ui/IceIcon';
import { portalReturnTarget } from './navigation-target';
import { PortalBackLink } from './PortalBackLink';
import { WORKSPACE_NAV, organizerSection } from '../../config/workspace-navigation';
const sections = [
  ['', PORTAL.HOME, 'calendar'],
  ['/activites', PORTAL.ACTIVITIES, 'ticket'],
  ['/reservations', WORKSPACE_NAV.PARTICIPANTS, 'person'],
  ['/partager', PORTAL.SHARE, 'arrow'],
  ['/reglages', WORKSPACE_NAV.SETTINGS, 'calendar'],
] as const;
interface Props {
  readonly organizations: readonly OrganizationSummary[];
  readonly operator: boolean;
  readonly brand: ReactNode;
  readonly account: ReactNode;
}
export function PortalNav({ organizations, operator, brand, account }: Props) {
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
      onClick={(event) => {
        if (event.target instanceof Element && event.target.closest('a')) setExpanded(false);
      }}
    >
      <MobileBar
        selected={selected}
        path={path}
        title={title}
        expanded={expanded}
        toggle={() => setExpanded(!expanded)}
      />
      {brand}
      <div id="organizer-navigation" className="portal-nav-links">
        {selected ? <OrganizationNav selected={selected} path={path} /> : null}
        <PortalUtilities operator={operator} path={path} />
        {account}
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
        <>
          <Link
            href="/plateforme"
            aria-current={path.startsWith('/plateforme') ? 'page' : undefined}
          >
            {ADMIN.TITLE}
          </Link>
          <Link
            href={ADMIN_SECURITY.PATH}
            aria-current={path === ADMIN_SECURITY.PATH ? 'page' : undefined}
          >
            {ADMIN_SECURITY.MENU}
          </Link>
        </>
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
        const active = organizerSection(path, `/app/${selected.id}`) === suffix;
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
      <PortalBackLink
        className="portal-back"
        href={portalReturnTarget(path, selected?.id).href}
        label={portalReturnTarget(path, selected?.id).label}
      >
        ← {APPEARANCE.BACK}
      </PortalBackLink>
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
  if (path === ADMIN_SECURITY.PATH) return ADMIN_SECURITY.MENU;
  if (selected && path.startsWith(`/app/${selected.id}/seances/`)) return SESSION_UI.TITLE;
  if (path.startsWith('/plateforme')) return ADMIN.TITLE;
  const section = selected
    ? sections.find(([suffix]) => organizerSection(path, `/app/${selected.id}`) === suffix)
    : null;
  return section?.[1] ?? PORTAL.ORGANIZATIONS;
}

function closeOnEscape(event: KeyboardEvent<HTMLElement>, expanded: boolean, close: () => void) {
  if (event.key !== 'Escape' || !expanded) return;
  close();
  event.currentTarget.querySelector<HTMLButtonElement>('.portal-menu-toggle')?.focus();
}
