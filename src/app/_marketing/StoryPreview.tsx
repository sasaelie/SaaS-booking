'use client';
import { DemoPlayback, DemoRegion } from './DemoControls';
import { DemoCalendar } from './DemoCalendar';
import { DemoPhoto } from './DemoPhoto';
export function StoryPreview() {
  return (
    <DemoRegion className="marketing-story-demo">
      <div className="marketing-story-scene">
        <div className="marketing-story-back" aria-hidden="true" />
        <div className="marketing-story-photo">
          <DemoPhoto />
        </div>
        <DemoCalendar />
      </div>
      <DemoPlayback />
    </DemoRegion>
  );
}
