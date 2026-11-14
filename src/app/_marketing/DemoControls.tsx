'use client';
import type { ReactNode } from 'react';
import { MARKETING_PREVIEW as UI } from '../../config/marketing-preview';
import { useMarketingDemo } from './MarketingDemo';
export function DemoRegion({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className: string;
}) {
  const { state, running } = useMarketingDemo();
  return (
    <div className={className} data-booking-demo="" data-phase={state.phase} data-running={running}>
      {children}
    </div>
  );
}
export function DemoPlayback() {
  const { state, dispatch, scene } = useMarketingDemo();
  return (
    <div className="marketing-demo-actions">
      <span>
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
