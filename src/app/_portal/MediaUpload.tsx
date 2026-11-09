'use client';
import { STORY_UI } from '../../config/story';
import { useId } from 'react';
import { PORTAL, SETTINGS_UI, PAYMENT_RULES } from '../../config/constants';
import { useMediaUpload } from './use-media-upload';
interface Props {
  readonly organizationId: string;
  readonly kind: 'logo' | 'background';
  readonly existing: boolean;
  readonly disabled: boolean;
}
export function MediaUpload(props: Props) {
  const id = useId();
  const state = useMediaUpload(props.organizationId, props.kind);
  return (
    <div className="portal-panel">
      <h3>{props.kind === 'logo' ? SETTINGS_UI.LOGO : SETTINGS_UI.BACKGROUND}</h3>
      {props.kind === 'background' ? <p className="portal-muted">{STORY_UI.PHOTO_HINT}</p> : null}
      {props.existing ? (
        <img
          className="portal-image-preview"
          src={`/api/branding/${props.organizationId}/${props.kind}`}
          alt=""
        />
      ) : null}
      <MediaForm id={id} disabled={props.disabled || state.pending} state={state} />
      {props.existing ? (
        <button
          type="button"
          className="portal-text-button"
          disabled={state.pending || props.disabled}
          onClick={() => void state.remove()}
        >
          {SETTINGS_UI.REMOVE}
        </button>
      ) : null}
      {state.message ? (
        <p role="status" className="portal-muted">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
function MediaForm({
  id,
  disabled,
  state,
}: {
  readonly id: string;
  readonly disabled: boolean;
  readonly state: ReturnType<typeof useMediaUpload>;
}) {
  return (
    <form className="portal-form" onSubmit={state.upload}>
      <label className="portal-field" htmlFor={id}>
        <span>{SETTINGS_UI.MEDIA_HINT}</span>
        <input
          id={id}
          type="file"
          name="image"
          accept={PAYMENT_RULES.ALLOWED_PROOF_MIME_TYPES.join(',')}
          required
          disabled={disabled}
        />
      </label>
      <button className="liquid-ice-button portal-button" disabled={disabled}>
        {state.pending ? PORTAL.SAVING : SETTINGS_UI.UPLOAD}
      </button>
    </form>
  );
}
