'use client';
import { useState } from 'react';
import { SETTINGS_UI } from '../../config/constants';
interface Props {
  readonly src: string;
  readonly pending: boolean;
}
export function MediaPreview({ src, pending }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  async function decode(image: HTMLImageElement) {
    try {
      await image.decode();
      setLoaded(image.naturalWidth > 0);
    } catch {
      setFailed(true);
    }
  }
  return (
    <div className="media-preview-status">
      <img
        className="portal-image-preview"
        src={src}
        alt="Aperçu de l’image enregistrée"
        onLoad={(event) => void decode(event.currentTarget)}
        onError={() => setFailed(true)}
      />
      <p
        className="status-badge"
        role="status"
        data-tone={failed ? 'red' : loaded && !pending ? 'green' : 'orange'}
      >
        {failed
          ? SETTINGS_UI.MEDIA_FAILED
          : loaded && !pending
            ? SETTINGS_UI.MEDIA_READY
            : SETTINGS_UI.MEDIA_LOADING}
      </p>
    </div>
  );
}
