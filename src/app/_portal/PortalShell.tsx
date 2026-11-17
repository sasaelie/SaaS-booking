import { PortalReturn } from './PortalReturn';
import { PortalScene } from './PortalScene';
import type { ReactNode } from 'react';
import type { PortalActor, OrganizationSummary } from '../../core/ports/portal-models';
import { PortalNav } from './PortalNav';
import { PortalAccount, PortalBrand } from './PortalIdentity';
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
        <PortalNav
          organizations={organizations}
          operator={operator}
          brand={<PortalBrand />}
          account={<PortalAccount actor={actor} />}
        />
      </aside>
      <main className="portal-main">
        <PortalReturn organizationIds={organizations.map((organization) => organization.id)} />
        {children}
      </main>
    </div>
  );
}
