import { INTERFACE_QUALITY as UI } from '../config/interface-quality';
import { AppLink } from './_ui/AppLink';
export default function NotFound() {
  return (
    <main className="portal-auth" id="contenu">
      <section className="portal-panel portal-auth-card">
        <h1>{UI.NOT_FOUND_TITLE}</h1>
        <p>{UI.NOT_FOUND_NOTE}</p>
        <AppLink className="liquid-ice-button portal-button" href="/">
          {UI.HOME}
        </AppLink>
      </section>
    </main>
  );
}
