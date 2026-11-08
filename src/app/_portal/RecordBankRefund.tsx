import { PORTAL, ACTIVITY_UI, INPUT_LIMITS } from '../../config/constants';
import { PortalForm } from './PortalForm';
import { PortalField } from './PortalField';
export function RecordBankRefund({
  organizationId,
  bookingId,
}: {
  readonly organizationId: string;
  readonly bookingId: string;
}) {
  return (
    <PortalForm
      action="record-bank-refund"
      organizationId={organizationId}
      submitLabel={ACTIVITY_UI.REFUND_RECORD}
      compact
    >
      <input type="hidden" name="bookingId" value={bookingId} />
      <PortalField
        label={ACTIVITY_UI.REFUND_REFERENCE}
        name="reference"
        required
        maxLength={INPUT_LIMITS.KEY_MAX}
      />
      <label className="portal-check">
        <input type="checkbox" required />
        {ACTIVITY_UI.REFUND_CONFIRM}
      </label>
      <p className="portal-muted">{PORTAL.MANUAL_REFUND}</p>
    </PortalForm>
  );
}
