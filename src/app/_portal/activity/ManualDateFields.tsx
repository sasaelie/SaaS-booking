import { ACTIVITY_UI, ACTIVITY_DEFAULTS, INPUT_LIMITS } from '../../../config/constants';
import { PortalField } from '../PortalField';
export function ManualDateFields() {
  return (
    <div className="portal-form-grid">
      <PortalField label={ACTIVITY_UI.DATE} name="date" type="date" required />
      <PortalField label={ACTIVITY_UI.END_DATE} name="endDate" type="date" />
      <PortalField
        label={ACTIVITY_UI.START}
        name="start"
        type="time"
        required
        defaultValue={ACTIVITY_DEFAULTS.START}
      />
      <PortalField
        label={ACTIVITY_UI.END}
        name="end"
        type="time"
        required
        defaultValue={ACTIVITY_DEFAULTS.END}
      />
      <PortalField
        label={ACTIVITY_UI.CAPACITY}
        name="capacity"
        type="number"
        min={1}
        max={INPUT_LIMITS.MAX_CAPACITY}
        required
        defaultValue={ACTIVITY_DEFAULTS.CAPACITY}
      />
    </div>
  );
}
