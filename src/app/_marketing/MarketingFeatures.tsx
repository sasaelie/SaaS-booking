import { MARKETING as UI } from '../../config/marketing';
import { IceIcon } from '../_ui/IceIcon';
export function MarketingWorkflow() {
  return (
    <section
      className="marketing-section marketing-container"
      id="fonctionnement"
      aria-labelledby="fonctionnement-titre"
    >
      <div className="marketing-section-heading">
        <p className="marketing-eyebrow">{UI.WORKFLOW_EYEBROW}</p>
        <h2 id="fonctionnement-titre">{UI.WORKFLOW_TITLE}</h2>
      </div>
      <ol className="marketing-steps">
        {UI.STEPS.map((step) => (
          <li key={step.number}>
            <span className="marketing-step-number" aria-hidden="true">
              {step.number}
            </span>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
export function MarketingBenefits() {
  return (
    <section className="marketing-section marketing-container" aria-labelledby="avantages-titre">
      <div className="marketing-section-heading">
        <p className="marketing-eyebrow">{UI.BENEFITS_EYEBROW}</p>
        <h2 id="avantages-titre">{UI.BENEFITS_TITLE}</h2>
      </div>
      <div className="marketing-benefits">
        {UI.BENEFITS.map((item) => (
          <article key={item.title} className="portal-panel marketing-benefit">
            <span className="marketing-feature-icon">
              <IceIcon name={item.icon} />
            </span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
