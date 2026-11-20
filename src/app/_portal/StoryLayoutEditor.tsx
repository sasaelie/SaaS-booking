'use client';
import type { StoryLayout } from '../../core/validation/story-layout';
import { STORY_LAYOUT as UI } from '../../config/story-layout';
import { storyPosition } from '../_ui/StoryCanvas';
import { useStoryDrag } from './use-story-drag';
export function StoryLayoutEditor({
  layout,
  change,
  title,
  price,
}: {
  readonly layout: StoryLayout | null;
  readonly change: (layout: StoryLayout | null) => void;
  readonly title: string;
  readonly price: string;
}) {
  const drag = useStoryDrag(layout ?? UI.DEFAULT, change);
  return (
    <div className="story-layout-editor">
      <div className="story-canvas" role="group" aria-label={UI.TITLE}>
        {(['title', 'price'] as const).map((key) => (
          <button
            key={key}
            type="button"
            className={`story-positioned story-drag-handle story-positioned-${key}`}
            data-long-title={key === 'title' && title.length >= UI.LONG_TITLE_LENGTH}
            aria-label={key === 'title' ? UI.TITLE_HANDLE : UI.PRICE_HANDLE}
            style={storyPosition((layout ?? UI.DEFAULT)[key])}
            onPointerDown={(e) => drag.start(e, key)}
            onPointerMove={drag.move}
            onPointerUp={drag.stop}
            onPointerCancel={drag.stop}
            onLostPointerCapture={drag.stop}
            onKeyDown={(e) => drag.keyboard(e, key)}
          >
            <span className="story-drag-grip" aria-hidden="true">
              ⠿
            </span>
            {key === 'title' ? title : price}
          </button>
        ))}
      </div>
    </div>
  );
}
export function StoryLayoutControls({
  layout,
  change,
}: {
  readonly layout: StoryLayout | null;
  readonly change: (layout: StoryLayout | null) => void;
}) {
  const value = layout ?? UI.DEFAULT;
  return (
    <fieldset className="story-placement-controls">
      <legend>{UI.TITLE}</legend>
      <p>{UI.HINT}</p>
      {(['title', 'price'] as const).map((key) => (
        <div key={key}>
          <strong>{key === 'title' ? UI.TITLE_HANDLE : UI.PRICE_HANDLE}</strong>
          {(['x', 'y'] as const).map((axis) => (
            <label key={axis}>
              {axis === 'x' ? UI.HORIZONTAL : UI.VERTICAL} · {value[key][axis]} %
              <input
                type="range"
                min={UI.MIN}
                max={UI.MAX}
                step={UI.STEP}
                value={value[key][axis]}
                onChange={(event) =>
                  change({ ...value, [key]: { ...value[key], [axis]: Number(event.target.value) } })
                }
              />
            </label>
          ))}
        </div>
      ))}
      <button type="button" className="portal-text-button" onClick={() => change(null)}>
        {UI.RESET}
      </button>
    </fieldset>
  );
}
