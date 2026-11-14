'use client';
import Link from 'next/link';
import Image from 'next/image';
import { MARKETING_PREVIEW as UI } from '../../config/marketing-preview';
import { IceIcon } from '../_ui/IceIcon';
import { formatMoney } from '../_ui/format-money';
import { DemoPlayback, DemoRegion } from './DemoControls';
import { useMarketingDemo } from './MarketingDemo';
import { MARKETING_VISUALS } from '../../config/marketing-visuals';
type Example = (typeof UI.EXAMPLES)[number];
export function BookingPreview({ connected }: { readonly connected: boolean }) {
  const { example, session, dispatch } = useMarketingDemo();
  return (
    <DemoRegion className="marketing-preview-wrap">
      <div className="marketing-preview-caption">
        <span>{UI.LABEL}</span>
        <IceIcon name="arrow" />
      </div>
      <DemoPlayback />
      <div className="portal-panel marketing-preview">
        <PreviewSwitch
          selected={example.key}
          onSelect={(item) => dispatch({ type: 'example', index: UI.EXAMPLES.indexOf(item) })}
        />
        <PreviewActivity example={example} />
        <PreviewSessions
          example={example}
          selected={session.label}
          onSelect={(index) => dispatch({ type: 'session', index })}
        />
        <PreviewActions connected={connected} />
      </div>
      <p className="marketing-preview-note">{UI.FICTION}</p>
    </DemoRegion>
  );
}
function PreviewActions({ connected }: { readonly connected: boolean }) {
  const { state, session, dispatch } = useMarketingDemo();
  return (
    <>
      <p className="ice-sr-only" role="status" aria-live={state.playing ? 'off' : 'polite'}>
        {UI.SELECTED} : {session.label}
        {state.booked ? ` · ${UI.SIMULATED}` : ''}
      </p>
      <button
        type="button"
        className="liquid-ice-button portal-button marketing-preview-simulate"
        onClick={() => {
          dispatch({ type: 'book' });
          showDemoResult();
        }}
      >
        {UI.SIMULATE}
        <IceIcon name="arrow" />
      </button>
      <Link
        className="liquid-ice-button portal-button marketing-preview-cta"
        href={connected ? '/app' : '/inscription'}
      >
        {connected ? UI.CONNECTED_ACTION : UI.ACTION}
        <IceIcon name="arrow" />
      </Link>
    </>
  );
}
function showDemoResult() {
  const calendar = document.getElementById('demo-planning');
  calendar?.focus({ preventScroll: true });
  calendar?.scrollIntoView({
    block: 'center',
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
  });
}
function PreviewSessions({
  example,
  selected,
  onSelect,
}: {
  readonly example: Example;
  readonly selected: string;
  readonly onSelect: (index: number) => void;
}) {
  return (
    <fieldset className="marketing-preview-sessions">
      <legend>{UI.DATE}</legend>
      {example.sessions.map((time, index) => (
        <label key={time.label}>
          <input
            type="radio"
            name="example-session"
            checked={time.label === selected}
            onChange={() => onSelect(index)}
          />
          <span>{time.label}</span>
          <IceIcon name="check" />
        </label>
      ))}
    </fieldset>
  );
}
function PreviewSwitch({
  selected,
  onSelect,
}: {
  readonly selected: string;
  readonly onSelect: (example: Example) => void;
}) {
  return (
    <fieldset className="marketing-preview-switch">
      <legend className="ice-sr-only">{UI.CHOOSE}</legend>
      {UI.EXAMPLES.map((item) => (
        <label key={item.key}>
          <input
            type="radio"
            name="example"
            value={item.key}
            checked={selected === item.key}
            onChange={() => onSelect(item)}
          />
          <span>{item.label}</span>
        </label>
      ))}
    </fieldset>
  );
}
function PreviewActivity({ example }: { readonly example: Example }) {
  return (
    <>
      <div className="marketing-preview-identity">
        <span className="marketing-preview-avatar">{example.initials}</span>
        <div>
          <strong>{example.organization}</strong>
          <small>{UI.ONLINE}</small>
        </div>
        <IceIcon name="lock" />
      </div>
      <div className="marketing-preview-activity" data-example={example.key}>
        <Image
          className="marketing-preview-photo"
          src={example.image}
          alt=""
          fill
          loading="eager"
          sizes={MARKETING_VISUALS.IMAGE_SIZES}
        />
        <p className="marketing-preview-tag">{example.tag}</p>
        <h2>{example.title}</h2>
        <p>{example.text}</p>
        <div className="marketing-preview-price">
          <strong>{formatMoney(example.priceCents, 'EUR')}</strong>
          <span>{UI.TOTAL}</span>
        </div>
      </div>
      <p className="marketing-preview-availability">
        <span aria-hidden="true" />
        {example.availability}
      </p>
    </>
  );
}
