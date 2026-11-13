import { MARKETING as UI } from '../../config/marketing';
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
