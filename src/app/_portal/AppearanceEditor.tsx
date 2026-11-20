'use client';
import { StoryTextChoices } from './StoryTextChoices';
import { AppearanceActions } from './AppearanceActions';
import type { OrganizationSummary, PortalActivity } from '../../core/ports/portal-models';
import { AppearanceActivityPreview } from './AppearanceActivityPreview';
import { APPEARANCE as UI } from '../../config/appearance';
import { MEMBER_ROLES, PORTAL } from '../../config/constants';
import { useAppearance } from './use-appearance';
import { ColorScene } from '../_ui/ColorScene';
export function AppearanceEditor({
  organization,
  activities = [],
}: {
  readonly organization: OrganizationSummary;
  readonly activities?: readonly PortalActivity[];
}) {
  const state = useAppearance(organization);
  return (
    <section className="appearance-editor">
      <AppearanceControls state={state} organization={organization} activities={activities} />
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
function AppearancePreview({ hue, name }: { readonly hue: number | null; readonly name: string }) {
  return (
    <div className="appearance-preview" role="region" aria-label={UI.PREVIEW}>
      <ColorScene hue={hue} />
      <span className="appearance-preview-label">{UI.ORGANIZER_LABEL}</span>
      <div className="ice-cube-shell appearance-sample">
        <strong>{name}</strong>
        <p>{PORTAL.ACTIVITIES}</p>
        <span className="appearance-sample-line" />
      </div>
    </div>
  );
}

function AppearanceControls({
  state,
  organization,
  activities,
}: {
  readonly state: ReturnType<typeof useAppearance>;
  readonly organization: OrganizationSummary;
  readonly activities: readonly PortalActivity[];
}) {
  return (
    <fieldset
      className="appearance-workspace"
      disabled={state.pending || organization.role !== MEMBER_ROLES.OWNER}
    >
      <AppearanceSettings state={state} />
      {state.target === 'participant' ? (
        <div className="appearance-preview" role="region" aria-label={UI.PREVIEW}>
          <ColorScene hue={state.customHue} />
          <AppearanceActivityPreview
            organization={organization}
            activities={activities}
            state={state}
          />
        </div>
      ) : (
        <AppearancePreview hue={state.customHue} name={organization.name} />
      )}
      <AppearanceActions state={state} organization={organization} />
    </fieldset>
  );
}

function AppearanceSettings({ state }: { readonly state: ReturnType<typeof useAppearance> }) {
  return (
    <div className="appearance-controls">
      <TargetSwitch value={state.target} change={state.setTarget} />
      <p className="portal-muted">{UI.NOTE}</p>
      <ColorRange state={state} />
      {state.target === 'participant' ? (
        <StoryTextChoices value={state.storyTextTone} change={state.changeTone} />
      ) : null}
    </div>
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
