import { PressableLink as Link } from '../../_ui/PressableLink';
import { AdministrationTabStrip } from '../AdministrationTabStrip';
import { PLATFORM_SETTINGS as UI } from '../../../config/platform-settings';
export function PlatformSettingsNavigation({
  connection = false,
}: {
  readonly connection?: boolean;
}) {
  return (
    <AdministrationTabStrip label={UI.TITLE} activeKey={String(connection)}>
      <Link
        className="liquid-ice-button"
        href="/plateforme/parametres"
        aria-current={!connection ? 'page' : undefined}
      >
        {UI.PROFILE}
      </Link>
      <Link
        className="liquid-ice-button"
        href="/plateforme/parametres/peppol"
        aria-current={connection ? 'page' : undefined}
      >
        {UI.CONNECTIONS}
      </Link>
    </AdministrationTabStrip>
  );
}
