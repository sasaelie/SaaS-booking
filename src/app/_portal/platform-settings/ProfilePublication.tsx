import type { PlatformSettingsState } from '../../../core/ports/platform-settings';
import { PLATFORM_SETTINGS as UI } from '../../../config/platform-settings';
import { PublicProfileDetails } from '../../_marketing/PublicProfileDetails';
import { PressableLink as Link } from '../../_ui/PressableLink';
import { StatusBadge } from '../StatusBadge';
import type { SettingsMutation } from './SettingsFeedback';
type Props = {
  readonly state: PlatformSettingsState;
  readonly action: SettingsMutation;
  readonly dirty: boolean;
};
export function ProfilePublication({ state, action, dirty }: Props) {
  const published = state.mode === 'PUBLISHED';
  const changed =
    published && (dirty || JSON.stringify(state.draft) !== JSON.stringify(state.published));
  return (
    <section className="portal-panel platform-settings-preview">
      <h2>{UI.PREVIEW}</h2>
      <StatusBadge
        status={{
          tone: changed ? 'orange' : published ? 'green' : 'neutral',
          label: changed ? UI.DRAFT_CHANGES : published ? UI.PUBLIC : UI.PRIVATE,
        }}
      />
      <PublicProfileDetails profile={state.draft} legal />
      <p className="portal-muted">{UI.DRAFT_NOTE}</p>
      {dirty ? (
        <p className="portal-muted" role="status">
          {UI.UNSAVED}
        </p>
      ) : null}
      <PublicationActions state={state} action={action} dirty={dirty} />
    </section>
  );
}
function PublicationActions({ state, action, dirty }: Props) {
  return (
    <div className="platform-settings-actions">
      <button
        className="liquid-ice-button portal-button portal-action-button"
        data-tone="green"
        disabled={dirty || action.pending || !state.revision}
        onClick={() => action.execute({ action: 'publish', revision: state.revision })}
      >
        {UI.PUBLISH}
      </button>
      {state.mode === 'PUBLISHED' ? (
        <button
          className="portal-secondary-action"
          disabled={action.pending}
          onClick={() => action.execute({ action: 'unpublish', revision: state.revision })}
        >
          {UI.UNPUBLISH}
        </button>
      ) : null}
      <Link
        className="portal-inline-link"
        href="/contact"
        target="_blank"
        rel="noopener noreferrer"
      >
        {UI.OPEN}
      </Link>
    </div>
  );
}
