'use client';
import { MARKETING_DEMO } from '../../config/marketing-demo';
import { useMarketingDemo } from './MarketingDemo';
export function DemoAvailability() {
  const { example, booked, transitions } = useMarketingDemo();
  const available = example.capacity - (booked ? 1 : 0);
  return (
    <p className="marketing-preview-availability">
      <span aria-hidden="true" />
      <span>
        <span
          className="marketing-preview-count marketing-demo-fade"
          data-demo-fade={transitions.availability}
        >
          {available}
        </span>{' '}
        <span
          className="marketing-preview-unit marketing-demo-fade"
          data-demo-fade={transitions.availabilityLabel}
        >
          {available === 1 ? MARKETING_DEMO.PLACE : MARKETING_DEMO.PLACES}
        </span>
      </span>
    </p>
  );
}
