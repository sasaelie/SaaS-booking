import type { ReactNode } from 'react';
import type { StoryTextTone } from '../../config/story';
export function StoryPanel({
  tone,
  photoUrl,
  children,
}: {
  readonly tone: StoryTextTone;
  readonly photoUrl: string | null;
  readonly children: ReactNode;
}) {
  return (
    <aside className="ice-story" data-tone={tone} data-photo={Boolean(photoUrl)}>
      {photoUrl ? <img className="ice-story-photo" src={photoUrl} alt="" /> : null}
      {children}
    </aside>
  );
}
