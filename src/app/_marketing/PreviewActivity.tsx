'use client';
import { MARKETING_PREVIEW as UI, type MarketingExample } from '../../config/marketing-preview';
import { IceIcon } from '../_ui/IceIcon';
import { formatMoney } from '../_ui/format-money';
import { useMarketingDemo } from './MarketingDemo';
import { DemoPhoto } from './DemoPhoto';
import { DemoAvailability } from './DemoAvailability';
export function PreviewActivity({ example }: { readonly example: MarketingExample }) {
  const { exampleTransition } = useMarketingDemo();
  return (
    <>
      <div className="marketing-preview-identity">
        <span
          className="marketing-preview-avatar marketing-demo-fade"
          data-demo-fade={exampleTransition}
        >
          {example.initials}
        </span>
        <div>
          <strong className="marketing-demo-fade" data-demo-fade={exampleTransition}>
            {example.organization}
          </strong>
          <small>{UI.ONLINE}</small>
        </div>
        <IceIcon name="lock" />
      </div>
      <div className="marketing-preview-activity" data-example={example.key}>
        <DemoPhoto decorative />
        <div className="marketing-preview-copy">
          <ActivityCopy example={example} />
        </div>
      </div>
      <DemoAvailability />
    </>
  );
}
function ActivityCopy({ example }: { readonly example: MarketingExample }) {
  const { exampleTransition } = useMarketingDemo();
  return (
    <>
      <p className="marketing-preview-tag marketing-demo-fade" data-demo-fade={exampleTransition}>
        {example.tag}
      </p>
      <h2 className="marketing-demo-fade" data-demo-fade={exampleTransition}>
        {example.title}
      </h2>
      <p className="marketing-demo-fade" data-demo-fade={exampleTransition}>
        {example.text}
      </p>
      <div className="marketing-preview-price">
        <strong className="marketing-demo-fade" data-demo-fade={exampleTransition}>
          {formatMoney(example.priceCents, 'EUR')}
        </strong>
        <span>{UI.TOTAL}</span>
      </div>
    </>
  );
}
