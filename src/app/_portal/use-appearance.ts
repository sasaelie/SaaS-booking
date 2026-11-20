'use client';
import type { StoryTextTone } from '../../config/story';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { OrganizationSummary } from '../../core/ports/portal-models';
import { APPEARANCE as UI } from '../../config/appearance';
import { PORTAL } from '../../config/constants';
import { portalRequest } from './portal-request';
import type { StoryLayout } from '../../core/validation/story-layout';
type Colors = {
  storyLayout: StoryLayout | null;
  storyTextTone: StoryTextTone;
  organizerHue: number | null;
  participantHue: number | null;
};
export function useAppearance(organization: OrganizationSummary) {
  const [target, setTarget] = useState<'organizer' | 'participant'>('participant');
  const [colors, setColors] = useState<Colors>({
    storyLayout: organization.storyLayout ?? null,
    storyTextTone: organization.storyTextTone,
    organizerHue: organization.organizerHue,
    participantHue: organization.participantHue,
  });
  const [saved, setSaved] = useState(colors);
  const operation = useAppearanceSave(organization.id, colors, () => setSaved(colors));
  const key = target === 'organizer' ? 'organizerHue' : 'participantHue';
  const hue = colors[key] ?? (target === 'organizer' ? UI.ORGANIZER : UI.PARTICIPANT);
  const dirty =
    JSON.stringify(colors.storyLayout) !== JSON.stringify(saved.storyLayout) ||
    colors.storyTextTone !== saved.storyTextTone ||
    colors.organizerHue !== saved.organizerHue ||
    colors.participantHue !== saved.participantHue;
  return {
    target,
    setTarget,
    hue,
    customHue: colors[key],
    storyTextTone: colors.storyTextTone,
    storyLayout: colors.storyLayout,
    dirty,
    ...operation,
    ...appearanceChanges(colors, setColors, key, operation.clear),
  };
}
function appearanceChanges(
  colors: Colors,
  setColors: (value: Colors) => void,
  key: 'organizerHue' | 'participantHue',
  clear: () => void,
) {
  return {
    changeLayout: (storyLayout: StoryLayout | null) => {
      setColors({ ...colors, storyLayout });
      clear();
    },
    changeTone: (storyTextTone: StoryTextTone) => {
      setColors({ ...colors, storyTextTone });
      clear();
    },
    change: (value: number) => {
      setColors({ ...colors, [key]: value });
      clear();
    },
    reset: () => {
      setColors({
        storyLayout: colors.storyLayout,
        storyTextTone: 'WHITE',
        organizerHue: null,
        participantHue: null,
      });
      clear();
    },
  };
}
function useAppearanceSave(organizationId: string, colors: Colors, onSaved: () => void) {
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const router = useRouter();
  async function save() {
    if (pending) return;
    setPending(true);
    setMessage('');
    try {
      const result = await portalRequest({
        action: 'appearance',
        input: { organizationId, ...colors },
      });
      if ('error' in result) setMessage(result.error ?? PORTAL.ERROR);
      else {
        onSaved();
        setMessage(UI.SAVED);
        router.refresh();
      }
    } catch {
      setMessage(PORTAL.ERROR);
    } finally {
      setPending(false);
    }
  }
  return { message, pending, save, clear: () => setMessage('') };
}
