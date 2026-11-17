import type { PortalActor } from '../../core/ports/portal-models';
import { PORTAL } from '../../config/constants';
import { AppLink as Link } from '../_ui/AppLink';
import { SignOutButton } from './SignOutButton';

export function PortalBrand() {
  return (
    <Link
      href="/app"
      className="portal-brand"
      aria-label={`${PORTAL.PRODUCT} — ${PORTAL.ORGANIZATIONS}`}
    >
      <span className="ice-brand-mark" aria-hidden="true" />
      {PORTAL.PRODUCT}
    </Link>
  );
}

export function PortalAccount({ actor }: { readonly actor: PortalActor }) {
  return (
    <div className="portal-account">
      <strong>{actor.name}</strong>
      <span>{actor.email}</span>
      <SignOutButton />
    </div>
  );
}
