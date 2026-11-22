import type { CancellationPreview as Preview } from '../../core/validation/cancellation-preview';
import { CANCELLATION_PREVIEW as UI } from '../../config/cancellation-preview';
import { formatMoney } from '../../lib/format-money';
export function CancellationPreview({
  preview,
  timezone,
}: {
  readonly preview: Preview | null | undefined;
  readonly timezone: string;
}) {
  if (!preview) return null;
  return (
    <div className="manage-note">
      <p>
        {preview.eligible && preview.expiresAt
          ? `${UI.CREDIT} ${formatMoney(preview.valueCents, preview.currency)}, ${UI.VALID_UNTIL} ${new Intl.DateTimeFormat('fr-BE', { timeZone: timezone, dateStyle: 'long' }).format(new Date(preview.expiresAt))}.`
          : preview.paidValueCents > 0
            ? UI.NO_CREDIT
            : UI.UNPAID}
      </p>
      {preview.eligible ? <p>{UI.NO_CASH_REFUND}</p> : null}
      <small>{UI.RECHECK}</small>
    </div>
  );
}
