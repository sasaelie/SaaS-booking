'use client';
import { MARKETING_VISUALS as UI } from '../../config/marketing-visuals';
import { MARKETING_PREVIEW } from '../../config/marketing-preview';
import { IceIcon } from '../_ui/IceIcon';
import { useMarketingDemo } from './MarketingDemo';
export function DemoCalendar() {
  const { example, session, state } = useMarketingDemo();
  return (
    <div
      id="demo-planning"
      role="region"
      aria-label={UI.CALENDAR_REGION}
      aria-describedby="demo-calendar-event demo-calendar-result"
      tabIndex={-1}
      className="portal-panel marketing-calendar-preview"
      data-booked={state.booked}
    >
      <p>{UI.CALENDAR_LABEL}</p>
      <h3>
        <IceIcon name="calendar" />
        {UI.CALENDAR_TITLE}
      </h3>
      <p className="marketing-calendar-month">{MARKETING_PREVIEW.MONTH}</p>
      <CalendarWeek />
      <div className="marketing-calendar-event" id="demo-calendar-event">
        <span aria-hidden="true" />
        <div>
          <strong>{example.title}</strong>
          <p>{session.fullDate}</p>
          <p>
            {session.label} – {session.end}
          </p>
        </div>
      </div>
      <div className="marketing-calendar-next" id="demo-calendar-result">
        <IceIcon name={state.booked ? 'check' : 'clock'} />
        {state.booked ? MARKETING_PREVIEW.SIMULATED : MARKETING_PREVIEW.PENDING}
      </div>
    </div>
  );
}
function CalendarWeek() {
  const { session } = useMarketingDemo();
  return (
    <div className="marketing-calendar-week" aria-hidden="true">
      {UI.CALENDAR_DAYS.map((day, index) => (
        <span key={UI.CALENDAR_DATES[index]}>
          <small>{day}</small>
          <strong data-active={UI.CALENDAR_DATES[index] === session.date}>
            {UI.CALENDAR_DATES[index]}
          </strong>
        </span>
      ))}
    </div>
  );
}
