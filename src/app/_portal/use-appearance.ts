'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { OrganizationSummary } from '../../core/ports/portal-models';
import { APPEARANCE as UI } from '../../config/appearance';
import { PORTAL } from '../../config/constants';
import { portalRequest } from './portal-request';
type Colors = { organizerHue: number | null; participantHue: number | null };
export function useAppearance(organization: OrganizationSummary) {
  const [target, setTarget] = useState<'organizer' | 'participant'>('participant');
  const [colors, setColors] = useState<Colors>({
    organizerHue: organization.organizerHue,
    participantHue: organization.participantHue,
  });
  const [saved, setSaved] = useState(colors);
  const operation = useAppearanceSave(organization.id, colors, () => setSaved(colors));
  const key = target === 'organizer' ? 'organizerHue' : 'participantHue';
  const hue = colors[key] ?? (target === 'organizer' ? UI.ORGANIZER : UI.PARTICIPANT);
  const dirty =
    colors.organizerHue !== saved.organizerHue || colors.participantHue !== saved.participantHue;
  return {
    target,
    setTarget,
    hue,
    dirty,
    ...operation,
    change: (value: number) => {
      setColors({ ...colors, [key]: value });
      operation.clear();
    },
    reset: () => {
      setColors({ organizerHue: UI.ORGANIZER, participantHue: UI.PARTICIPANT });
      operation.clear();
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
