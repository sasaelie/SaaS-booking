'use client';
import { StoryPanel } from '../_ui/StoryPanel';
import { StoryTextChoices } from './StoryTextChoices';
import { STORY_UI, type StoryTextTone } from '../../config/story';
import Link from 'next/link';
import type { OrganizationSummary } from '../../core/ports/portal-models';
import { APPEARANCE as UI } from '../../config/appearance';
import { MEMBER_ROLES, PORTAL } from '../../config/constants';
import { useAppearance } from './use-appearance';
import { ColorScene } from '../_ui/ColorScene';
export function AppearanceEditor({ organization }: { readonly organization: OrganizationSummary }) {
  const state = useAppearance(organization);
  return (
    <section className="portal-panel appearance-editor">
      <AppearanceControls state={state} organization={organization} />
      <p role="status">{state.message || (state.dirty ? UI.DIRTY : '')}</p>
      <Link
        className="appearance-public-link"
        href={`/${organization.slug}?from=appearance`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {UI.OPEN}
      </Link>
    </section>
  );
}
function TargetSwitch({
  value,
  change,
}: {
  readonly value: string;
  readonly change: (value: 'organizer' | 'participant') => void;
}) {
  return (
    <div className="appearance-target" role="group" aria-label={UI.PREVIEW}>
      <button
        type="button"
        aria-pressed={value === 'organizer'}
        onClick={() => change('organizer')}
      >
        {UI.ORGANIZER_LABEL}
      </button>
      <button
        type="button"
        aria-pressed={value === 'participant'}
        onClick={() => change('participant')}
      >
        {UI.PARTICIPANT_LABEL}
      </button>
    </div>
  );
}
function AppearancePreview({
  hue,
  target,
  name,
  tone,
  photoUrl,
}: {
  readonly hue: number;
  readonly target: string;
  readonly name: string;
  readonly tone: StoryTextTone;
  readonly photoUrl: string | null;
}) {
  return (
    <div className="appearance-preview" aria-label={UI.PREVIEW}>
      <ColorScene hue={hue} />
      <span className="appearance-preview-label">
        {target === 'organizer' ? UI.ORGANIZER_LABEL : UI.PARTICIPANT_LABEL}
      </span>
      {target === 'participant' ? (
        <div className="appearance-story-preview">
          <StoryPanel tone={tone} photoUrl={photoUrl}>
            <span>{name}</span>
            <h2>{STORY_UI.SAMPLE}</h2>
            <p>{STORY_UI.PRICE}</p>
          </StoryPanel>
        </div>
      ) : (
        <div className="ice-cube-shell appearance-sample">
          <strong>{name}</strong>
          <p>{target === 'organizer' ? PORTAL.ACTIVITIES : PORTAL.BOOKINGS}</p>
          <span className="appearance-sample-line" />
        </div>
      )}
    </div>
  );
}

function AppearanceControls({
  state,
  organization,
}: {
  readonly state: ReturnType<typeof useAppearance>;
  readonly organization: OrganizationSummary;
}) {
  return (
    <fieldset disabled={state.pending || organization.role !== MEMBER_ROLES.OWNER}>
      <TargetSwitch value={state.target} change={state.setTarget} />
      <p className="portal-muted">{UI.NOTE}</p>
      <ColorRange state={state} />
      {state.target === 'participant' ? (
        <StoryTextChoices value={state.storyTextTone} change={state.changeTone} />
      ) : null}
      <AppearancePreview
        hue={state.hue}
        target={state.target}
        name={organization.name}
        tone={state.storyTextTone}
        photoUrl={organization.hasBackground ? `/api/branding/${organization.id}/background` : null}
      />
      <button
        type="button"
        className="liquid-ice-button portal-button"
        onClick={state.save}
        disabled={!state.dirty || state.pending}
      >
        {state.pending ? PORTAL.SAVING : UI.SAVE}
      </button>
      <button type="button" className="appearance-reset" onClick={state.reset}>
        {UI.RESET}
      </button>
    </fieldset>
  );
}

function ColorRange({ state }: { readonly state: ReturnType<typeof useAppearance> }) {
  return (
    <label className="appearance-label">
      {UI.COLOR}
      <input
        type="range"
        min={UI.MIN}
        max={UI.MAX}
        value={state.hue}
        onChange={(e) => state.change(Number(e.target.value))}
      />
    </label>
  );
}
