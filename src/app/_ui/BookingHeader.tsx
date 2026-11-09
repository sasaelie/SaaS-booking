import { StoryPanel } from './StoryPanel';
import type { BookingPageData } from '../../core/use-cases/get-booking-page.use-case';
import { AUDIENCE_POLICIES, BOOKING_UI } from '../../config/constants';
import { formatMoney } from './format-money';
import { IceIcon } from './IceIcon';
export function BookingHeader({ data }: { readonly data: BookingPageData }) {
  const audience =
    data.audiencePolicy === AUDIENCE_POLICIES.MINORS_ONLY
      ? BOOKING_UI.AUDIENCE_MINOR
      : data.audiencePolicy === AUDIENCE_POLICIES.ADULTS_ONLY
        ? BOOKING_UI.AUDIENCE_ADULT
        : BOOKING_UI.AUDIENCE_ALL;
  return (
    <StoryPanel tone={data.brand.storyTextTone} photoUrl={data.brand.backgroundUrl}>
      <div className="ice-story-top">
        <span className="ice-eyebrow">{BOOKING_UI.EYEBROW}</span>
        <h1>{data.activityName}</h1>
        <p>{BOOKING_UI.INDIVIDUAL}</p>
      </div>
      <div hidden={Boolean(data.brand.backgroundUrl)} className="ice-sculpture" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="ice-story-bottom">
        <p className="ice-audience">
          <IceIcon name="person" />
          {audience}
        </p>
        {data.audiencePolicy === AUDIENCE_POLICIES.MINORS_ONLY ? (
          <p className="ice-audience-hint">{BOOKING_UI.ADULT_BOOKER}</p>
        ) : null}
        <div className="ice-price">
          <strong>{formatMoney(data.priceCents, data.currency)}</strong>
          <span>{BOOKING_UI.PRICE_UNIT}</span>
        </div>
      </div>
    </StoryPanel>
  );
}
