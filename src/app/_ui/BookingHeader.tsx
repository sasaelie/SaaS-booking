import type { BookingPageData } from '../../core/use-cases/get-booking-page.use-case';
import { formatMoney } from './format-money';
export function BookingHeader({ data }: { readonly data: BookingPageData }) {
  return (
    <header>
      <p>{data.organizationName}</p>
      <h1>{data.activityName}</h1>
      <strong>{formatMoney(data.priceCents, data.currency)}</strong>
    </header>
  );
}
