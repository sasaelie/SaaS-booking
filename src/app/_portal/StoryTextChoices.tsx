import { STORY_TONES, STORY_UI, type StoryTextTone } from '../../config/story';
export function StoryTextChoices({
  value,
  change,
}: {
  readonly value: StoryTextTone;
  readonly change: (tone: StoryTextTone) => void;
}) {
  return (
    <fieldset className="story-text-choices">
      <legend>{STORY_UI.TITLE}</legend>
      <p className="portal-muted">{STORY_UI.HINT}</p>
      <div>
        {STORY_TONES.map((tone) => (
          <label key={tone} data-tone={tone}>
            <input
              type="radio"
              name="storyTextTone"
              value={tone}
              checked={value === tone}
              onChange={() => change(tone)}
            />
            <span className="story-color-square" aria-hidden="true">
              {value === tone ? '✓' : ''}
            </span>
            {STORY_UI[tone]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
