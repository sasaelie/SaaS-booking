import { MARKETING_VISUALS as UI } from '../../config/marketing-visuals';
import { StoryPreview } from './StoryPreview';
import { FeatureTiles } from './FeatureTiles';
export function MarketingWorkflow() {
  return (
    <section
      className="marketing-section marketing-container"
      id="fonctionnement"
      aria-labelledby="fonctionnement-titre"
    >
      <div className="marketing-section-heading">
        <p className="marketing-eyebrow">{UI.STORY_EYEBROW}</p>
        <h2 id="fonctionnement-titre">{UI.STORY_TITLE}</h2>
        <p>{UI.STORY_INTRO}</p>
      </div>
      <div className="marketing-product-story">
        <StoryPreview />
        <FeatureTiles />
      </div>
    </section>
  );
}
