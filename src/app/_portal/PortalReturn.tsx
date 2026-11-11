'use client';
import { PortalBackLink } from './PortalBackLink';
import { usePathname } from 'next/navigation';
import { portalReturnTarget } from './navigation-target';
export function PortalReturn({ organizationIds }: { readonly organizationIds: readonly string[] }) {
  const path = usePathname();
  const selected = organizationIds.find((id) => path.startsWith(`/app/${id}`));
  if (path.startsWith('/plateforme') || (selected && path.startsWith(`/app/${selected}/seances/`)))
    return null;
  const target = portalReturnTarget(path, selected);
  return (
    <PortalBackLink className="portal-desktop-return" href={target.href} label={target.label}>
      ← {target.label}
    </PortalBackLink>
  );
}
