import Link from 'next/link';
import { MARKETING as UI } from '../../config/marketing';
import { MARKETING_FAQ } from '../../config/marketing-faq';
import { IceIcon } from '../_ui/IceIcon';
export function MarketingFaq() {
  return (
    <section
      className="marketing-section marketing-container marketing-faq"
      id="questions"
      aria-labelledby="questions-titre"
    >
      <div className="marketing-section-heading">
        <p className="marketing-eyebrow">{UI.FAQ_EYEBROW}</p>
        <h2 id="questions-titre">{UI.FAQ_TITLE}</h2>
        <Link className="marketing-text-link" href="/contact">
          {UI.CONTACT}
          <IceIcon name="arrow" />
        </Link>
      </div>
      <div>
        {MARKETING_FAQ.map((item) => (
          <details key={item.question}>
            <summary>
              {item.question}
              <IceIcon name="next" />
            </summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
export function MarketingFinalAction({ connected }: { readonly connected: boolean }) {
  return (
    <section className="marketing-container marketing-final" aria-labelledby="commencer-titre">
      <div className="portal-panel">
        <h2 id="commencer-titre">{connected ? UI.FINAL_CONNECTED : UI.FINAL_TITLE}</h2>
        <p>{connected ? UI.FINAL_CONNECTED_DESCRIPTION : UI.FINAL_DESCRIPTION}</p>
        <Link
          className="liquid-ice-button portal-button"
          href={connected ? '/app' : '/inscription?formule=liberte'}
        >
          {connected ? UI.FINAL_CONNECTED_ACTION : UI.FINAL_ACTION}
          <IceIcon name="arrow" />
        </Link>
      </div>
    </section>
  );
}
