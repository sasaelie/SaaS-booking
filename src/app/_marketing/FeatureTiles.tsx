'use client';
import { useState } from 'react';
import { MARKETING_VISUALS as UI } from '../../config/marketing-visuals';
import { FeatureTile } from './FeatureTile';
export function FeatureTiles() {
  const [active, setActive] = useState<string | null>(null);
  return (
    <div className="marketing-feature-explorer" role="group" aria-label={UI.FEATURE_LABEL}>
      <p className="marketing-feature-hint">{UI.CARD_HINT}</p>
      {UI.FEATURES.map((feature) => (
        <FeatureTile
          key={feature.id}
          feature={feature}
          open={active === feature.id}
          onOpen={() => setActive(feature.id)}
          onClose={() => setActive((current) => (current === feature.id ? null : current))}
          onToggle={() => setActive((current) => (current === feature.id ? null : feature.id))}
        />
      ))}
    </div>
  );
}
