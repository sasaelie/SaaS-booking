'use client';
import { MARKETING_PREVIEW as UI, type MarketingExample } from '../../config/marketing-preview';
import { MARKETING_DEMO } from '../../config/marketing-demo';
import { IceIcon } from '../_ui/IceIcon';
import { formatMoney } from '../_ui/format-money';
import { useMarketingDemo } from './MarketingDemo';
import { DemoPhoto } from './DemoPhoto';
export function PreviewActivity({ example }: { readonly example: MarketingExample }) {
  const { state, booked, exampleTransition } = useMarketingDemo();
  const available = example.capacity - (booked ? 1 : 0);
  return (
    <>
      <div
        className="marketing-preview-identity marketing-demo-fade"
        data-demo-fade={exampleTransition}
      >
        <span className="marketing-preview-avatar">{example.initials}</span>
        <div>
          <strong>{example.organization}</strong>
          <small>{UI.ONLINE}</small>
        </div>
        <IceIcon name="lock" />
      </div>
      <div className="marketing-preview-activity" data-example={example.key}>
        <DemoPhoto decorative />
        <div
          className="marketing-preview-copy marketing-demo-fade"
          data-demo-fade={exampleTransition}
        >
          <ActivityCopy example={example} />
        </div>
      </div>
      <p
        className="marketing-preview-availability marketing-demo-fade"
        data-demo-fade={state.transition}
      >
        <span aria-hidden="true" />
        {available} {available === 1 ? MARKETING_DEMO.PLACE : MARKETING_DEMO.PLACES}
      </p>
    </>
  );
}
function ActivityCopy({ example }: { readonly example: MarketingExample }) {
  return (
    <>
      <p className="marketing-preview-tag">{example.tag}</p>
      <h2>{example.title}</h2>
      <p>{example.text}</p>
      <div className="marketing-preview-price">
        <strong>{formatMoney(example.priceCents, 'EUR')}</strong>
        <span>{UI.TOTAL}</span>
      </div>
    </>
  );
}
