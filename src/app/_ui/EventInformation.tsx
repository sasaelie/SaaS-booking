import { SERVICE } from '../../config/service';
import type { BookingPageData } from '../../core/use-cases/get-booking-page.use-case';
export function EventInformation({ data }: { readonly data: BookingPageData }) {
  if (!data.address && !data.addressDelayed && !data.practicalInfo) return null;
  return (
    <section className="event-information" aria-label={SERVICE.DETAILS}>
      {data.addressDelayed ? (
        <p>{SERVICE.DELAYED_NOTICE}</p>
      ) : data.address ? (
        <p>{data.address}</p>
      ) : null}
      {data.practicalInfo ? <p>{data.practicalInfo}</p> : null}
    </section>
  );
}
