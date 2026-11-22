'use client';
import { EMBED_HEALTH as H } from '../../config/embed-health';
import { StatusBadge } from './StatusBadge';
import { SiteEmbedCheck } from './SiteEmbedCheck';
import { useEmbedCheck } from './use-embed-check';
type Props = { readonly appUrl: string; readonly slug: string; readonly privatePreview: boolean };
export function WebsiteEmbedCheck({ appUrl, slug, privatePreview }: Props) {
  const check = useEmbedCheck(appUrl);
  return (
    <details className="portal-details sharing-embed-check">
      <summary>{H.HELP_TITLE}</summary>
      <div className="portal-list">
        <p className="portal-muted">{H.CHECK_NOTE}</p>
        {privatePreview ? <p role="note">{H.CHECK_PRIVATE}</p> : null}
        <button
          type="button"
          className="portal-secondary-action"
          onClick={check.start}
          disabled={check.state === 'loading'}
        >
          {H.CHECK}
        </button>
        <CheckFeedback state={check.state} privatePreview={privatePreview} />
        {check.attempt > 0 ? (
          <div className="sharing-check-preview" inert>
            <iframe
              key={check.attempt}
              ref={check.frame}
              src={`${appUrl}/embed/${slug}`}
              title={H.CHECK}
              tabIndex={-1}
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        ) : null}
        <SiteEmbedCheck slug={slug} />
      </div>
    </details>
  );
}
function CheckFeedback({
  state,
  privatePreview,
}: {
  readonly state: ReturnType<typeof useEmbedCheck>['state'];
  readonly privatePreview: boolean;
}) {
  if (state === 'idle') return null;
  const ready = state === 'ready';
  const label = ready
    ? privatePreview
      ? H.CHECK_PRIVATE_READY
      : H.CHECK_READY
    : state === 'loading'
      ? H.LOADING
      : state === 'unavailable'
        ? H.UNAVAILABLE
        : H.FAILED;
  return (
    <p role="status">
      <StatusBadge status={{ tone: ready && !privatePreview ? 'green' : 'orange', label }} />
    </p>
  );
}
