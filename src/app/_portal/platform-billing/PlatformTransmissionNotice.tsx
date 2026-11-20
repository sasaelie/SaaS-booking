import { PLATFORM_BILLING as UI } from '../../../config/platform-billing';
import { PressableLink as Link } from '../../_ui/PressableLink';
import { PLATFORM_SETTINGS } from '../../../config/platform-settings';
import { StatusBadge } from '../StatusBadge';
export function PlatformTransmissionNotice() {
  return (
    <section className="administration-transmission">
      <h3>{UI.TRANSMISSION_TITLE}</h3>
      <StatusBadge status={{ tone: 'orange', label: UI.TRANSMISSION_STATUS }} />
      <p className="portal-muted">{UI.TRANSMISSION_NOTE}</p>
      <Link className="portal-inline-link" href="/plateforme/parametres/peppol">
        {PLATFORM_SETTINGS.CONNECTIONS}
      </Link>
      <a href={UI.TRANSMISSION_URL} target="_blank" rel="noopener noreferrer">
        {UI.TRANSMISSION_LINK}
      </a>
    </section>
  );
}
