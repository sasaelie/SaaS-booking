import { headers } from 'next/headers';
import { portal } from '../../../../../composition/portal';
import { PLATFORM_SETTINGS as UI } from '../../../../../config/platform-settings';
import { PortalHeading } from '../../../../_portal/PortalHeading';
import { PortalError } from '../../../../_portal/PortalError';
import { PlatformSettingsNavigation } from '../../../../_portal/platform-settings/PlatformSettingsNavigation';
import { PlatformPeppolPreparation } from '../../../../_portal/platform-settings/PlatformPeppolPreparation';
export default async function Page() {
  const app = portal(new Headers(await headers()));
  const state = app.ok ? await app.value.settings.read() : app;
  if (!state.ok) return <PortalError />;
  return (
    <>
      <PortalHeading title={UI.TITLE} description={UI.HINT} />
      <PlatformSettingsNavigation connection />
      <PlatformPeppolPreparation key={state.value.revision} state={state.value} />
    </>
  );
}
