'use client';
import { useState, type ComponentProps } from 'react';
import { AppLink } from './AppLink';
type Props = Omit<
  ComponentProps<typeof AppLink>,
  'onPointerDown' | 'onPointerUp' | 'onPointerCancel' | 'onPointerLeave' | 'onBlur'
>;
export function PressableLink(props: Props) {
  const [pressed, setPressed] = useState(false);
  const release = () => setPressed(false);
  return (
    <AppLink
      {...props}
      data-pointer-pressed={pressed}
      onPointerDown={(event) => {
        if (event.isPrimary && event.button === 0) setPressed(true);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={release}
      onBlur={release}
    />
  );
}
