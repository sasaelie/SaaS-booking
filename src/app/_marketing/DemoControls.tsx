'use client';
import type { ReactNode, SyntheticEvent } from 'react';
import { MARKETING_PREVIEW as UI } from '../../config/marketing-preview';
import { useMarketingDemo } from './MarketingDemo';
export function DemoRegion({
  children,
  className,
}: {
  readonly children: ReactNode;
  readonly className: string;
}) {
  const { dispatch } = useMarketingDemo();
  const pause = (event: SyntheticEvent<HTMLElement>) => {
    if (!(event.target instanceof Element) || !event.target.closest('[data-demo-playback]'))
      dispatch({ type: 'pause' });
  };
  return (
    <div
      className={className}
      data-booking-demo=""
      onPointerDownCapture={pause}
      onFocusCapture={pause}
    >
      {children}
    </div>
  );
}
export function DemoPlayback() {
  const { state, dispatch } = useMarketingDemo();
  return (
    <div className="marketing-demo-actions">
      <span>{UI.AUTO}</span>
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
