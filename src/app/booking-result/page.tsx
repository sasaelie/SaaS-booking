import { INTERFACE_QUALITY as UI } from '../../config/interface-quality';
import { AppLink as Link } from '../_ui/AppLink';
import { IceIcon } from '../_ui/IceIcon';
export default function BookingResult() {
  return (
    <main className="participant-page public-result-page">
      <section className="portal-panel public-result-content">
        <IceIcon name="clock" />
        <h1>{UI.PAYMENT_TITLE}</h1>
        <p>{UI.PAYMENT_NOTE}</p>
        <p>{UI.PAYMENT_NEXT}</p>
        <Link className="portal-button liquid-ice-button" href="/connexion?acces=participant">
          {UI.FIND_BOOKING}
        </Link>
        <Link className="home-secondary-link" href="/">
          {UI.HOME}
        </Link>
      </section>
    </main>
  );
}
