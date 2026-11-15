'use client';
import Link from 'next/link';
import { MARKETING_PREVIEW as UI } from '../../config/marketing-preview';
import { IceIcon } from '../_ui/IceIcon';
import { DemoPlayback, DemoRegion } from './DemoControls';
import { useMarketingDemo } from './MarketingDemo';
import { DemoDraft } from './DemoDraft';
import { PreviewActivity } from './PreviewActivity';
type Example = (typeof UI.EXAMPLES)[number];
export function BookingPreview({ connected }: { readonly connected: boolean }) {
  const { example, session, dispatch, state, transitions } = useMarketingDemo();
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
        <div>
          <PreviewActivity example={example} />
          <div
            className="marketing-preview-flow marketing-demo-fade"
            data-demo-fade={transitions.publication}
          >
            {state.phase === 'draft' ? (
              <DemoDraft />
            ) : (
              <>
                <PreviewSessions
                  example={example}
                  selected={session.label}
                  onSelect={(index) => dispatch({ type: 'session', index })}
                />
                <PreviewActions connected={connected} />
              </>
            )}
          </div>
        </div>
      </div>
      <p className="marketing-preview-note">{UI.FICTION}</p>
    </DemoRegion>
  );
}
function PreviewActions({ connected }: { readonly connected: boolean }) {
  const { state, session, dispatch, booked } = useMarketingDemo();
  return (
    <>
      <p className="ice-sr-only" role="status" aria-live={state.playing ? 'off' : 'polite'}>
        {UI.SELECTED} : {session.label}
        {booked ? ` · ${UI.SIMULATED}` : ''}
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
