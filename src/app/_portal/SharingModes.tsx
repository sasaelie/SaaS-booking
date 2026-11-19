'use client';
import { useId, useState, type KeyboardEvent, type ReactNode } from 'react';
import { SHARE_UI } from '../../config/constants';
import { SHARING_MODES } from '../../config/share-labels';
type SharingMode = (typeof SHARING_MODES)[number][0];
export function SharingModes({
  social,
  website,
}: {
  readonly social: ReactNode;
  readonly website: ReactNode;
}) {
  const [mode, setMode] = useState<SharingMode>(SHARING_MODES[0][0]);
  const id = useId();
  return (
    <div className="sharing-modes">
      <div
        className="sharing-mode-tabs"
        role="tablist"
        aria-label={SHARE_UI.CHOOSE_MODE}
        onKeyDown={(event) => moveMode(event, mode, setMode, id)}
      >
        {SHARING_MODES.map(([value, label]) => (
          <button
            type="button"
            role="tab"
            className="liquid-ice-button portal-button"
            key={value}
            id={`${id}-${value}`}
            aria-controls={`${id}-panel`}
            aria-selected={mode === value}
            tabIndex={mode === value ? 0 : -1}
            onClick={() => setMode(value)}
          >
            {label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-${mode}`} tabIndex={0}>
        {mode === SHARING_MODES[0][0] ? social : website}
      </div>
    </div>
  );
}
function moveMode(
  event: KeyboardEvent<HTMLDivElement>,
  current: SharingMode,
  select: (mode: SharingMode) => void,
  id: string,
) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const next =
    event.key === 'Home'
      ? SHARING_MODES[0][0]
      : event.key === 'End'
        ? SHARING_MODES[1][0]
        : current === SHARING_MODES[0][0]
          ? SHARING_MODES[1][0]
          : SHARING_MODES[0][0];
  select(next);
  document.getElementById(`${id}-${next}`)?.focus();
}
