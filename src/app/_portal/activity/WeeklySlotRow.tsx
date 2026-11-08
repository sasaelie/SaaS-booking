import {
  ACTIVITY_UI,
  ACTIVITY_DEFAULTS,
  WEEKDAY_LABELS,
  INPUT_LIMITS,
} from '../../../config/constants';
import { PortalField } from '../PortalField';
import { PortalSelect } from '../PortalSelect';
export function WeeklySlotRow({
  remove,
  removable,
}: {
  readonly remove: () => void;
  readonly removable: boolean;
}) {
  return (
    <div className="portal-slot-row">
      <SlotDay />
      <PortalField
        label={ACTIVITY_UI.START}
        name="startTimeLocal"
        type="time"
        required
        defaultValue={ACTIVITY_DEFAULTS.START}
      />
      <PortalField
        label={ACTIVITY_UI.END}
        name="endTimeLocal"
        type="time"
        required
        defaultValue={ACTIVITY_DEFAULTS.END}
      />
      <SlotCapacity />
      <button
        type="button"
        disabled={!removable}
        onClick={remove}
        aria-label={ACTIVITY_UI.REMOVE_SLOT}
      >
        ×
      </button>
    </div>
  );
}

function SlotCapacity() {
  return (
    <PortalField
      label={ACTIVITY_UI.CAPACITY}
      name="slotCapacity"
      type="number"
      required
      min={1}
      max={INPUT_LIMITS.MAX_CAPACITY}
      defaultValue={ACTIVITY_DEFAULTS.CAPACITY}
    />
  );
}

function SlotDay() {
  return (
    <PortalSelect label={ACTIVITY_UI.DAY} name="dayOfWeek" defaultValue={ACTIVITY_DEFAULTS.DAY}>
      {WEEKDAY_LABELS.map((label, index) => (
        <option key={label} value={index}>
          {label}
        </option>
      ))}
    </PortalSelect>
  );
}
