import Link from 'next/link';
import { PORTAL } from '../../config/constants';
export function PortalError({ message = PORTAL.ERROR }: { readonly message?: string }) {
  return (
    <div className="portal-panel portal-error" role="alert">
      <h1>{message}</h1>
      <Link className="liquid-ice-button portal-button" href="/app">
        {PORTAL.BACK}
      </Link>
    </div>
  );
}
