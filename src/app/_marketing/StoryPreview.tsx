import Image from 'next/image';
import { MARKETING_VISUALS as UI } from '../../config/marketing-visuals';
import { IceIcon } from '../_ui/IceIcon';
export function StoryPreview() {
  return (
    <div className="marketing-story-scene">
      <div className="marketing-story-back" aria-hidden="true" />
      <div className="marketing-story-photo">
        <Image src={UI.STORY_IMAGE} alt={UI.STORY_IMAGE_ALT} fill sizes={UI.IMAGE_SIZES} />
      </div>
      <div className="portal-panel marketing-calendar-preview">
        <p>{UI.CALENDAR_LABEL}</p>
        <h3>
          <IceIcon name="calendar" />
          {UI.CALENDAR_TITLE}
        </h3>
        <div className="marketing-calendar-week" aria-hidden="true">
          {UI.CALENDAR_DAYS.map((day, index) => (
            <span key={UI.CALENDAR_DATES[index]}>
              <small>{day}</small>
              <strong data-active={UI.CALENDAR_DATES[index] === UI.CALENDAR_ACTIVE_DATE}>
                {UI.CALENDAR_DATES[index]}
              </strong>
            </span>
          ))}
        </div>
        <div className="marketing-calendar-event">
          <span aria-hidden="true" />
          <div>
            <strong>{UI.CALENDAR_ACTIVITY}</strong>
            <p>{UI.CALENDAR_TIME}</p>
          </div>
        </div>
        <div className="marketing-calendar-next">
          <IceIcon name="clock" />
          {UI.CALENDAR_SECOND}
        </div>
      </div>
    </div>
  );
}
