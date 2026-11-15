import { StoryPanel } from './StoryPanel';
import type { BookingPageData } from '../../core/use-cases/get-booking-page.use-case';
import { AUDIENCE_POLICIES, BOOKING_UI } from '../../config/constants';
import { formatMoney } from './format-money';
import { IceIcon } from './IceIcon';
import { StoryCanvas } from './StoryCanvas';
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
        {!data.brand.storyLayout ? <h1>{data.activityName}</h1> : null}
        <p>{BOOKING_UI.INDIVIDUAL}</p>
      </div>
      {data.brand.storyLayout ? (
        <StoryCanvas
          layout={data.brand.storyLayout}
          title={data.activityName}
          price={formatMoney(data.priceCents, data.currency)}
          level="h1"
        />
      ) : null}
      <div hidden={Boolean(data.brand.backgroundUrl)} className="ice-sculpture" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <BookingStoryBottom data={data} audience={audience} />
    </StoryPanel>
  );
}

function BookingStoryBottom({
  data,
  audience,
}: {
  readonly data: BookingPageData;
  readonly audience: string;
}) {
  return (
    <div className="ice-story-bottom">
      <p className="ice-audience">
        <IceIcon name="person" />
        {audience}
      </p>
      {data.audiencePolicy === AUDIENCE_POLICIES.MINORS_ONLY ? (
        <p className="ice-audience-hint">{BOOKING_UI.ADULT_BOOKER}</p>
      ) : null}
      {!data.brand.storyLayout ? (
        <div className="ice-price">
          <strong>{formatMoney(data.priceCents, data.currency)}</strong>
          <span>{BOOKING_UI.PRICE_UNIT}</span>
        </div>
      ) : null}
    </div>
  );
}
