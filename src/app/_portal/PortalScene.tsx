'use client';
import { usePathname } from 'next/navigation';
import type { OrganizationSummary } from '../../core/ports/portal-models';
import { ColorScene } from '../_ui/ColorScene';
export function PortalScene({
  organizations,
}: {
  readonly organizations: readonly OrganizationSummary[];
}) {
  const path = usePathname();
  const selected = organizations.find((org) => path.startsWith(`/app/${org.id}`));
  return selected?.organizerHue != null ? <ColorScene hue={selected.organizerHue} /> : null;
}
