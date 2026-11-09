import { CopyCode } from './CopyCode';
import { SERVICE, CODE_STATES } from '../../config/service';
import type { PortalBooking } from '../../core/ports/portal-models';
import { PortalForm } from './PortalForm';
import { PortalField } from './PortalField';
import { computeVoucherExpiryDate } from '../../core/domain/voucher-engine';
import { portalDate } from './date-label';
import { formatMoney } from '../_ui/format-money';
interface Props {
  readonly booking: PortalBooking;
  readonly organizationId: string;
  readonly timezone: string;
}
export function ManualVoucherForm({ booking, organizationId, timezone }: Props) {
  const date = computeVoucherExpiryDate(new Date(), SERVICE.DEFAULT_MONTHS)
    .toISOString()
    .slice(0, SERVICE.ISO_DATE_LENGTH);
  const eligible =
    booking.status === 'CANCELLED_BY_ATTENDEE' &&
    !booking.refundStatus &&
    booking.amountPaidCents + (booking.voucherDiscountCents ?? 0) > 0 &&
    !booking.vouchers?.some((v) => v.kind === 'CANCELLATION');
  if (!eligible && !booking.vouchers?.length) return null;
  return (
    <section className="portal-panel">
      <h3>{SERVICE.CODES}</h3>
      <VoucherHistory booking={booking} timezone={timezone} />
      {eligible ? (
        <PortalForm
          action="manual-voucher"
          organizationId={organizationId}
          submitLabel={SERVICE.GRANT_CODE}
          compact
        >
          <input type="hidden" name="bookingId" value={booking.id} />
          <input type="hidden" name="timezone" value={timezone} />
          <PortalField
            label={SERVICE.EXPIRY}
            type="date"
            name="expiresOn"
            required
            defaultValue={date}
          />
          <label className="portal-check">
            <input type="checkbox" name="confirmed" required />
            {SERVICE.CONFIRM_CODE}
          </label>
        </PortalForm>
      ) : null}
    </section>
  );
}

function VoucherHistory({ booking, timezone }: Pick<Props, 'booking' | 'timezone'>) {
  return (
    <>
      {booking.vouchers?.map((v) => (
        <div className="portal-notice" key={v.code}>
          <CopyCode value={v.code} /> {formatMoney(v.initialValueCents, v.currency)} —{' '}
          {new Date(v.expiresAt) <= new Date() && v.status === 'ACTIVE'
            ? CODE_STATES['EXPIRED']
            : CODE_STATES[v.status]}{' '}
          — {portalDate(v.expiresAt, timezone)}
        </div>
      ))}
    </>
  );
}
