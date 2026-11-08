import type { CSSProperties } from 'react';
export function ColorScene({ hue }: { readonly hue: number }) {
  return (
    <div
      className="color-scene"
      aria-hidden="true"
      style={{ '--appearance-hue': hue } as CSSProperties}
    />
  );
}
