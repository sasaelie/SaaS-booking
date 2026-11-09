import type { ReactNode } from 'react';
import type { StoryTextTone } from '../../config/story';
export function StoryPanel({
  tone,
  photoUrl,
  children,
  as: Tag = 'aside',
  className = '',
}: {
  readonly tone: StoryTextTone;
  readonly photoUrl: string | null;
  readonly children: ReactNode;
  readonly as?: 'aside' | 'article';
  readonly className?: string;
}) {
  return (
    <Tag className={`ice-story ${className}`} data-tone={tone} data-photo={Boolean(photoUrl)}>
      {photoUrl ? <img className="ice-story-photo" src={photoUrl} alt="" /> : null}
      {children}
    </Tag>
  );
}
