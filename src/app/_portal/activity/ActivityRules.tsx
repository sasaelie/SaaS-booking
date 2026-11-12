import { useSearchParams } from 'next/navigation';
import type { PortalActivity } from '../../../core/ports/portal-models';
import { ACTIVITY_UI, BOOKING_LIMITS, VOUCHER_RULES } from '../../../config/constants';
import { PortalField } from '../PortalField';
export function ActivityRules({ initial }: { readonly initial?: PortalActivity }) {
  return (
    <details className="portal-details" open={useSearchParams().get('edit') === 'terms' || undefined}>
      <summary>{ACTIVITY_UI.ADVANCED}</summary>
      <div className="portal-form-grid">
        <PortalField
          label={ACTIVITY_UI.WINDOW}
          name="bookingWindowWeeks"
          type="number"
          required
          min={BOOKING_LIMITS.MIN_BOOKING_WINDOW_WEEKS}
          max={BOOKING_LIMITS.MAX_BOOKING_WINDOW_WEEKS}
          defaultValue={initial?.bookingWindowWeeks ?? BOOKING_LIMITS.DEFAULT_BOOKING_WINDOW_WEEKS}
        />
        <PortalField
          label={ACTIVITY_UI.NOTICE}
          name="noticeHoursForVoucher"
          type="number"
          required
          min={0}
          defaultValue={initial?.noticeHoursForVoucher ?? VOUCHER_RULES.DEFAULT_NOTICE_HOURS}
        />
        <PortalField
          label={ACTIVITY_UI.VALIDITY}
          name="voucherValidityMonths"
          type="number"
          required
          min={1}
          max={BOOKING_LIMITS.MAX_BOOKING_WINDOW_WEEKS}
          defaultValue={initial?.voucherValidityMonths ?? VOUCHER_RULES.DEFAULT_VALIDITY_MONTHS}
        />
      </div>
    </details>
  );
}
