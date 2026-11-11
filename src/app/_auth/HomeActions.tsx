import Link from 'next/link';
import { SHARE_UI } from '../../config/constants';
import { SignOutButton } from '../_portal/SignOutButton';
export function HomeActions({ name }: { readonly name: string | null }) {
  const connected = name !== null;
  return (
    <>
      {connected ? (
        <p className="landing-session-note">
          {SHARE_UI.CONNECTED_AS} <strong>{name}</strong>
        </p>
      ) : null}
      <div className="portal-share-buttons portal-landing-actions">
        {connected ? (
          <>
            <Link className="liquid-ice-button portal-button" href="/app">
              {SHARE_UI.OPEN_SPACES}
            </Link>
            <SignOutButton className="liquid-ice-button portal-button" />
          </>
        ) : (
          <>
            <Link className="liquid-ice-button portal-button" href="/inscription">
              {SHARE_UI.START}
            </Link>
            <Link className="liquid-ice-button portal-button" href="/connexion">
              {SHARE_UI.LOGIN}
            </Link>
          </>
        )}
      </div>
    </>
  );
}
