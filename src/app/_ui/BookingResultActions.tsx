import { EMBED, FORM_LABELS } from '../../config/constants';
import { simulationPath } from '../../config/simulation';
import type { BookingActionState } from '../actions/booking.actions';
import type { BookingFlowState } from './use-booking-flow';
import { IceIcon } from './IceIcon';
export function BookingResultActions({
  state,
  flow,
  onManage,
}: {
  readonly state: BookingActionState;
  readonly flow: BookingFlowState;
  readonly onManage?: () => void;
}) {
  const token = state.booking?.selfServiceToken;
  if (!token) return null;
  return (
    <>
      {onManage ? (
        <button type="button" className="ice-result-link ticket-manage-link" onClick={onManage}>
          {FORM_LABELS.MANAGE}
          <IceIcon name="arrow" />
        </button>
      ) : (
        <a
          className="ice-result-link ticket-manage-link"
          href={`${flow.data.simulationId ? simulationPath(flow.data.simulationId) + '/gestion' : '/manage'}#token=${encodeURIComponent(token)}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {FORM_LABELS.MANAGE}
          <IceIcon name="arrow" />
        </a>
      )}
      {flow.embedded ? <EmbeddedSiteReturn /> : null}
    </>
  );
}
export function EmbeddedSiteReturn() {
  return (
    <button
      type="button"
      className="home-secondary-link embedded-site-return"
      onClick={() => window.parent.postMessage({ type: EMBED.RETURN_TYPE }, '*')}
    >
      {EMBED.RETURN_SITE}
    </button>
  );
}
