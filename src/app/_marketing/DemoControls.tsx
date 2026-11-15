'use client';
import type { CSSProperties, ReactNode } from 'react';
import { MARKETING_PREVIEW as UI } from '../../config/marketing-preview';
import { useMarketingDemo } from './MarketingDemo';
import { MARKETING_DEMO } from '../../config/marketing-demo';
const fadeTimings = {
  '--demo-fade-out': `${MARKETING_DEMO.FADE_OUT_MS}ms`,
  '--demo-fade-in': `${MARKETING_DEMO.FADE_IN_MS}ms`,
} as CSSProperties;
export function DemoRegion({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className: string;
}) {
  const { state, running } = useMarketingDemo();
  return (
    <div
      className={className}
      style={fadeTimings}
      data-booking-demo=""
      data-phase={state.phase}
      data-running={running}
      data-transition={state.transition}
    >
      {children}
    </div>
  );
}
export function DemoPlayback() {
  const { state, dispatch, scene } = useMarketingDemo();
  return (
    <div className="marketing-demo-actions">
      <span className="marketing-demo-fade" data-demo-fade={state.transition}>
        {scene.actor} · <strong>{scene.label}</strong>
      </span>
      <button
        type="button"
        data-demo-playback=""
        onClick={() => dispatch({ type: state.playing ? 'pause' : 'play' })}
      >
        <span aria-hidden="true">{state.playing ? 'Ⅱ' : '▷'}</span>
        {state.playing ? UI.PAUSE : UI.PLAY}
      </button>
    </div>
  );
}
