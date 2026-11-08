import { PortalScene } from './PortalScene';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { PortalActor, OrganizationSummary } from '../../core/ports/portal-models';
import { PORTAL } from '../../config/constants';
import { PortalNav } from './PortalNav';
import { SignOutButton } from './SignOutButton';
export function PortalShell({
  actor,
  organizations,
  operator,
  children,
}: {
  readonly actor: PortalActor;
  readonly organizations: readonly OrganizationSummary[];
  readonly operator: boolean;
  readonly children: ReactNode;
}) {
  return (
    <div className="portal-root">
      <PortalScene organizations={organizations} />
      <aside className="portal-sidebar">
        <Link href="/app" className="portal-brand">
          <span className="ice-brand-mark" aria-hidden="true" />
          {PORTAL.PRODUCT}
        </Link>
        <PortalNav organizations={organizations} operator={operator} />
        <div className="portal-account">
          <strong>{actor.name}</strong>
          <span>{actor.email}</span>
          <SignOutButton />
        </div>
      </aside>
      <main className="portal-main">{children}</main>
    </div>
  );
}
