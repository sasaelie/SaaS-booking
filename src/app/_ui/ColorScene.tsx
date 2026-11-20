import type { CSSProperties } from 'react';
export function ColorScene({ hue }: { readonly hue: number | null }) {
  return (
    <div
      className="color-scene"
      aria-hidden="true"
      data-default={hue === null || undefined}
      style={hue === null ? undefined : ({ '--appearance-hue': hue } as CSSProperties)}
    />
  );
}
