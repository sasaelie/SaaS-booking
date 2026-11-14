'use client';
import { MARKETING_DEMO as UI } from '../../config/marketing-demo';
import { useMarketingDemo } from './MarketingDemo';
import { formatMoney } from '../_ui/format-money';
export function DemoDraft() {
  const { example, session } = useMarketingDemo();
  const fields = [
    [UI.TITLE, example.title],
    [UI.SESSION, `${session.label} – ${session.end}`],
    [UI.CAPACITY, String(example.capacity)],
    [UI.PRICE, formatMoney(example.priceCents, 'EUR')],
  ];
  return (
    <div className="marketing-demo-draft">
      <dl>
        {fields.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p>{UI.PUBLISHING}</p>
    </div>
  );
}
