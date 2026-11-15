'use client';
import Link from 'next/link';
import { useState } from 'react';
import { PLATFORM_BRAND } from '../../config/platform-brand';
import { PAGE_LOADING as UI } from '../../config/page-loading';
import { IceIcon } from '../_ui/IceIcon';
import { PageLoadingIndicator } from '../_ui/PageLoadingIndicator';
import './loading-preview.css';
type PreviewPhase = 'loading' | 'leaving' | 'ready';
export function LoadingPreview() {
  const [phase, setPhase] = useState<PreviewPhase>('loading');
  return (
    <main className="loading-preview-page">
      <div className="loading-preview-content">
        <Link href="/" className="loading-preview-back">
          <IceIcon name="back" />
          {UI.BACK}
        </Link>
        <p className="loading-preview-brand">{PLATFORM_BRAND.NAME}</p>
        <h1>{UI.PREVIEW_TITLE}</h1>
        <p className="loading-preview-intro">{UI.PREVIEW_DESCRIPTION}</p>
        <PreviewStage phase={phase} onExited={() => setPhase('ready')} />
        <PreviewActions
          phase={phase}
          onFinish={() => finishPreview(setPhase)}
          onReplay={() => setPhase('loading')}
        />
        <p className="loading-preview-hint">{UI.HINT}</p>
      </div>
    </main>
  );
}
function finishPreview(setPhase: (phase: PreviewPhase) => void) {
  const indicator = document.querySelector('#loading-preview-stage .page-loading-indicator');
  const opacity = indicator ? Number(getComputedStyle(indicator).opacity) : 0;
  if (!(indicator instanceof HTMLElement) || opacity === 0) {
    setPhase('ready');
    return;
  }
  indicator.style.setProperty('--page-loading-exit-from', String(opacity));
  setPhase('leaving');
}
function Ready() {
  return (
    <div className="loading-preview-ready" role="status">
      <div className="page-loading-pebble" aria-hidden="true">
        <IceIcon name="check" />
      </div>
      <h2>{UI.READY}</h2>
      <p>{UI.READY_DETAIL}</p>
    </div>
  );
}

function PreviewStage({
  phase,
  onExited,
}: {
  readonly phase: PreviewPhase;
  readonly onExited: () => void;
}) {
  return (
    <div
      id="loading-preview-stage"
      className="loading-preview-stage"
      data-loading={phase !== 'ready'}
    >
      {phase === 'ready' ? (
        <Ready />
      ) : (
        <PageLoadingIndicator leaving={phase === 'leaving'} onExited={onExited} />
      )}
    </div>
  );
}
type PreviewActionsProps = {
  readonly phase: PreviewPhase;
  readonly onFinish: () => void;
  readonly onReplay: () => void;
};
function PreviewActions({ phase, onFinish, onReplay }: PreviewActionsProps) {
  return (
    <div className="loading-preview-actions">
      <button
        type="button"
        className="liquid-ice-button portal-button"
        disabled={phase !== 'loading'}
        aria-controls="loading-preview-stage"
        onClick={onFinish}
      >
        {UI.FINISH}
      </button>
      <button
        type="button"
        className="liquid-ice-button portal-button"
        disabled={phase !== 'ready'}
        aria-controls="loading-preview-stage"
        onClick={onReplay}
      >
        {UI.REPLAY}
      </button>
    </div>
  );
}
