import type { PlatformFinanceSummary } from '../../core/ports/platform-reporting';
import { PLATFORM_REPORTING as UI } from '../../config/platform-reporting';
import { formatMoney } from '../_ui/format-money';
const metrics = [
  ['subscriptionCents', UI.INCOME],
  ['commissionCents', UI.COMMISSIONS],
  ['feeCents', UI.FEES],
  ['costCents', UI.OTHER_COSTS],
  ['balanceCents', UI.BALANCE],
  ['organizerCents', UI.BOOKING_VOLUME],
] as const;
export function PlatformFinanceMetrics({ summary }: { readonly summary: PlatformFinanceSummary }) {
  return (
    <section className="portal-panel administration-finance-summary">
      <dl>
        {metrics.map(([key, label]) => (
          <div key={key}>
            <dt>{label}</dt>
            <dd data-negative={summary[key] < 0}>{formatMoney(summary[key], 'EUR')}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
