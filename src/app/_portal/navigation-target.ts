import { NAVIGATION as UI } from '../../config/navigation';
export function portalReturnTarget(path: string, organizationId?: string) {
  if (path === '/app') return { href: '/', label: UI.HOME };
  if (!organizationId)
    return path.startsWith('/plateforme/')
      ? { href: '/plateforme', label: UI.ADMIN }
      : { href: '/app', label: UI.SPACES };
  const root = `/app/${organizationId}`;
  if (path === root) return { href: '/app', label: UI.SPACES };
  if (path.startsWith(`${root}/activites/`))
    return { href: `${root}/activites`, label: UI.ACTIVITIES };
  return { href: root, label: UI.DASHBOARD };
}
