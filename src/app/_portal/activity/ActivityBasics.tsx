import type { PortalActivity } from '../../../core/ports/portal-models';
import { ACTIVITY_UI } from '../../../config/constants';
import { ActivityDetailsFields } from './ActivityDetailsFields';
import { ActivityPricingFields } from './ActivityPricingFields';
export function ActivityBasics({ initial }: { readonly initial?: PortalActivity }) {
  return (
    <>
      <ActivityDetailsFields initial={initial} />
      <ActivityPricingFields initial={initial} />
      <label className="portal-check">
        <input name="requirePhone" type="checkbox" defaultChecked={initial?.requirePhone} />
        {ACTIVITY_UI.PHONE}
      </label>
      <p className="portal-muted">{ACTIVITY_UI.CONTACT_NOTE}</p>
    </>
  );
}
