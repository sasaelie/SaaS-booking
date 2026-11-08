import { headers } from 'next/headers';
import { portal } from '../../composition/portal';
export interface WorkspacePageProps {
  readonly params: Promise<{ organizationId: string }>;
}
export async function loadWorkspace(id: string) {
  const services = portal(new Headers(await headers()));
  return services.ok ? services.value.workspace.overview(id) : services;
}
