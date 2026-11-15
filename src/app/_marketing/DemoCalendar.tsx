'use client';
import { MARKETING_VISUALS as UI } from '../../config/marketing-visuals';
import { MARKETING_PREVIEW } from '../../config/marketing-preview';
import { IceIcon } from '../_ui/IceIcon';
import { useMarketingDemo } from './MarketingDemo';
import { DemoDraft } from './DemoDraft';
export function DemoCalendar() {
  const { state, booked, scene } = useMarketingDemo();
  return (
    <div
      id="demo-planning"
      role="region"
      aria-label={UI.CALENDAR_REGION}
      aria-describedby="demo-calendar-event demo-calendar-result"
      tabIndex={-1}
      className="portal-panel marketing-calendar-preview"
      data-booked={booked}
      data-phase={state.phase}
    >
      <p>{UI.CALENDAR_LABEL}</p>
      <h3>
        <IceIcon name="calendar" />
        {UI.CALENDAR_TITLE}
      </h3>
      <p className="marketing-calendar-month">{MARKETING_PREVIEW.MONTH}</p>
      <CalendarStage />
      <div
        className="marketing-calendar-next marketing-demo-fade"
        data-demo-fade={state.transition}
        id="demo-calendar-result"
      >
        <IceIcon name={booked ? 'check' : 'clock'} />
        {scene.status}
      </div>
    </div>
  );
}
function CalendarEvent() {
  const { example, session } = useMarketingDemo();
  return (
    <div className="marketing-calendar-event">
      <span aria-hidden="true" />
      <div>
        <strong>{example.title}</strong>
        <p>{session.fullDate}</p>
        <p>
          {session.label} – {session.end}
        </p>
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

function CalendarStage() {
  const { state } = useMarketingDemo();
  return (
    <div
      className="marketing-calendar-stage marketing-demo-fade"
      data-demo-fade={state.transition}
      id="demo-calendar-event"
    >
      {state.phase === 'draft' ? (
        <DemoDraft />
      ) : (
        <>
          <CalendarWeek />
          <CalendarEvent />
        </>
      )}
    </div>
  );
}
