'use client';
import { useState } from 'react';
import { AppLink as Link } from '../_ui/AppLink';
import { StoryPanel } from '../_ui/StoryPanel';
import { StoryLayoutControls, StoryLayoutEditor } from './StoryLayoutEditor';
import type { OrganizationSummary, PortalActivity } from '../../core/ports/portal-models';
import type { useAppearance } from './use-appearance';
import { STORY_LAYOUT as UI } from '../../config/story-layout';
import { STORY_UI } from '../../config/story';
import { formatMoney } from '../../lib/format-money';
interface Props {
  readonly organization: OrganizationSummary;
  readonly activities: readonly PortalActivity[];
  readonly state: ReturnType<typeof useAppearance>;
}
export function AppearanceActivityPreview({ organization, activities, state }: Props) {
  const [selected, setSelected] = useState(activities[0]?.id ?? '');
  const activity = activities.find((item) => item.id === selected) ?? activities[0];
  return (
    <>
      <ActivityChoice activities={activities} selected={activity?.id ?? ''} change={setSelected} />
      <div className="appearance-story-preview">
        <StoryPanel
          tone={state.storyTextTone}
          photoUrl={
            organization.hasBackground ? `/api/branding/${organization.id}/background` : null
          }
        >
          <span>{organization.name}</span>
          <StoryLayoutEditor
            layout={state.storyLayout}
            change={state.changeLayout}
            title={activity?.name ?? STORY_UI.SAMPLE}
            price={activity ? formatMoney(activity.priceCents, activity.currency) : STORY_UI.PRICE}
          />
        </StoryPanel>
      </div>
      <StoryLayoutControls layout={state.storyLayout} change={state.changeLayout} />
      {activity ? (
        <div className="appearance-activity-edit">
          <Link href={`/app/${organization.id}/activites/${activity.id}?edit=basics#activity-edit`}>
            {UI.EDIT}
          </Link>
          <p>{UI.EDIT_HINT}</p>
        </div>
      ) : null}
    </>
  );
}

function ActivityChoice({
  activities,
  selected,
  change,
}: {
  readonly activities: readonly PortalActivity[];
  readonly selected: string;
  readonly change: (value: string) => void;
}) {
  if (!activities.length) return null;
  return (
    <label className="portal-field">
      {UI.ACTIVITY}
      <select
        className="portal-input"
        value={selected}
        onChange={(event) => change(event.target.value)}
      >
        {activities.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </label>
  );
}
