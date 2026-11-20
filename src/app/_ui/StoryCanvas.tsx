import type { CSSProperties, ReactNode } from 'react';
import type { StoryLayout } from '../../core/validation/story-layout';
import { STORY_LAYOUT } from '../../config/story-layout';
export function storyPosition(point: StoryLayout['title']): CSSProperties {
  return {
    left: `${point.x}%`,
    top: `${point.y}%`,
    transform: `translate(-${point.x}%, -${point.y}%)`,
  };
}
export function StoryCanvas({
  layout,
  title,
  price,
  level = 'h2',
}: {
  readonly layout: StoryLayout;
  readonly title: string;
  readonly price: ReactNode;
  readonly level?: 'h1' | 'h2';
}) {
  const Heading = level;
  return (
    <div className="story-canvas">
      <div
        className="story-positioned story-positioned-title"
        data-long-title={title.length >= STORY_LAYOUT.LONG_TITLE_LENGTH}
        style={storyPosition(layout.title)}
      >
        <Heading>{title}</Heading>
      </div>
      <div className="story-positioned story-positioned-price" style={storyPosition(layout.price)}>
        <strong>{price}</strong>
      </div>
    </div>
  );
}
