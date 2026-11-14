'use client';
import Image from 'next/image';
import { MARKETING_VISUALS as UI } from '../../config/marketing-visuals';
import { useMarketingDemo } from './MarketingDemo';
import { DemoPlayback, DemoRegion } from './DemoControls';
import { DemoCalendar } from './DemoCalendar';
export function StoryPreview() {
  const { example } = useMarketingDemo();
  return (
    <DemoRegion className="marketing-story-demo">
      <div className="marketing-story-scene">
        <div className="marketing-story-back" aria-hidden="true" />
        <div className="marketing-story-photo">
          <Image src={example.image} alt={example.imageAlt} fill sizes={UI.IMAGE_SIZES} />
        </div>
        <DemoCalendar />
      </div>
      <DemoPlayback />
    </DemoRegion>
  );
}
