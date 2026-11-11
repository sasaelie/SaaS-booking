import type { PortalActivity } from '../../../core/ports/portal-models';
import { ACTIVITY_UI } from '../../../config/constants';
import { EventDetailsFields } from './EventDetailsFields';
import { ActivityDetailsFields } from './ActivityDetailsFields';
import { ActivityPricingFields } from './ActivityPricingFields';
export function ActivityBasics({
  initial,
  pro = true,
}: {
  readonly initial?: PortalActivity;
  readonly pro?: boolean;
}) {
  return (
    <>
      <ActivityDetailsFields initial={initial} />
      <EventDetailsFields initial={initial} />
      <ActivityPricingFields initial={initial} pro={pro} />
      <label className="portal-check">
        <input name="requirePhone" type="checkbox" defaultChecked={initial?.requirePhone} />
        {ACTIVITY_UI.PHONE}
      </label>
      <p className="portal-muted">{ACTIVITY_UI.CONTACT_NOTE}</p>
      {pro ? (
        <>
          <input type="hidden" name="externalFieldAvailable" value="true" />
          <label className="portal-check">
            <input
              type="checkbox"
              name="allowExternalBenefitExchange"
              defaultChecked={initial?.allowExternalBenefitExchange}
            />
            Autoriser les reports vers un cours en ligne (Studio Pro)
          </label>
        </>
      ) : null}
    </>
  );
}
