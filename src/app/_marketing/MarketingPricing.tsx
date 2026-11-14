import { MARKETING as UI } from '../../config/marketing';
import { MarketingOffer } from './MarketingOffer';
export function MarketingPricing() {
  return (
    <section
      className="marketing-section marketing-container marketing-pricing"
      id="tarifs"
      aria-labelledby="tarifs-titre"
    >
      <div className="marketing-section-heading">
        <p className="marketing-eyebrow">{UI.PRICING_EYEBROW}</p>
        <h2 id="tarifs-titre">{UI.PRICING_TITLE}</h2>
        <p>{UI.PRICING_DESCRIPTION}</p>
      </div>
      <div className="marketing-offers">
        <MarketingOffer plan="liberte" />
        <MarketingOffer plan="pro" />
      </div>
    </section>
  );
}
