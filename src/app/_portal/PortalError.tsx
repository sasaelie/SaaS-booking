import { AppLink as Link } from '../_ui/AppLink';
import { PORTAL } from '../../config/constants';
export function PortalError({
  message = PORTAL.ERROR,
  href = '/app',
  label = PORTAL.BACK,
}: {
  readonly message?: string;
  readonly href?: string;
  readonly label?: string;
}) {
  return (
    <div className="portal-panel portal-error" role="alert">
      <h1>{message}</h1>
      <Link className="liquid-ice-button portal-button" href={href}>
        {label}
      </Link>
    </div>
  );
}
