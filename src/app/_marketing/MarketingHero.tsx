import Link from 'next/link';
import { MARKETING as UI } from '../../config/marketing';
import { HomeActions } from '../_auth/HomeActions';
import { IceIcon } from '../_ui/IceIcon';
import { BookingPreview } from './BookingPreview';
export function MarketingHero({ name }: { readonly name: string | null }) {
  return (
    <section className="marketing-hero marketing-container" aria-labelledby="accueil-titre">
      <div className="marketing-hero-copy">
        <p className="marketing-eyebrow">{UI.EYEBROW}</p>
        <h1 id="accueil-titre">
          {UI.HERO_FIRST}
          <span>{UI.HERO_SECOND}</span>
        </h1>
        <p className="marketing-intro">{UI.HERO_DESCRIPTION}</p>
        <HomeActions name={name} />
        <ul className="marketing-reassurance">
          {UI.REASSURANCE.map((text) => (
            <li key={text}>
              <IceIcon name="check" />
              {text}
            </li>
          ))}
        </ul>
        <Link className="marketing-text-link" href="#fonctionnement">
          {UI.DISCOVER}
          <IceIcon name="arrow" />
        </Link>
      </div>
      <BookingPreview connected={name !== null} />
    </section>
  );
}
