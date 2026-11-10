import { SERVICE } from '../../config/service';
import type { BookingPageData } from '../../core/use-cases/get-booking-page.use-case';
export function EventInformation({ data }: { readonly data: BookingPageData }) {
  if (!data.address && !data.addressDelayed && !data.practicalInfo && !data.description)
    return null;
  return (
    <section className="event-information" aria-label={SERVICE.DETAILS}>
      {data.addressDelayed ? (
        <p>{SERVICE.DELAYED_NOTICE}</p>
      ) : data.address ? (
        <p>{data.address}</p>
      ) : null}
      {data.description ? (
        <details>
          <summary>{SERVICE.ABOUT}</summary>
          <p>{data.description}</p>
        </details>
      ) : null}
      {data.practicalInfo ? (
        <details>
          <summary>{SERVICE.PRACTICAL_SUMMARY}</summary>
          <p>{data.practicalInfo}</p>
        </details>
      ) : null}
    </section>
  );
}
