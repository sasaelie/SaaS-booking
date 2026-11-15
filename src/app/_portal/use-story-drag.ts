'use client';
import { useRef, type PointerEvent, type KeyboardEvent } from 'react';
import type { StoryLayout } from '../../core/validation/story-layout';
import { STORY_LAYOUT as UI } from '../../config/story-layout';
type Target = keyof StoryLayout;
interface DragState {
  readonly id: number;
  readonly key: Target;
  readonly x: number;
  readonly y: number;
  readonly point: StoryLayout['title'];
  readonly width: number;
  readonly height: number;
}
const bounded = (value: number) => Math.round(Math.max(UI.MIN, Math.min(UI.MAX, value)));
export function useStoryDrag(layout: StoryLayout, change: (value: StoryLayout) => void) {
  const drag = useRef<DragState | null>(null);
  function start(event: PointerEvent<HTMLButtonElement>, key: Target) {
    if (event.button !== 0) return;
    const target = event.currentTarget;
    const canvas = target.parentElement?.getBoundingClientRect();
    if (!canvas) return;
    const box = target.getBoundingClientRect();
    drag.current = {
      id: event.pointerId,
      key,
      x: event.clientX,
      y: event.clientY,
      point: layout[key],
      width: Math.max(1, canvas.width - box.width),
      height: Math.max(1, canvas.height - box.height),
    };
    target.setPointerCapture(event.pointerId);
  }
  function move(event: PointerEvent<HTMLButtonElement>) {
    const active = drag.current;
    if (!active || active.id !== event.pointerId) return;
    const x = bounded(active.point.x + ((event.clientX - active.x) / active.width) * UI.MAX);
    const y = bounded(active.point.y + ((event.clientY - active.y) / active.height) * UI.MAX);
    change({ ...layout, [active.key]: { x, y } });
  }
  return {
    start,
    move,
    keyboard: (event: KeyboardEvent<HTMLButtonElement>, key: Target) =>
      moveWithKeyboard(event, key, layout, change),
    stop: () => {
      drag.current = null;
    },
  };
}
function moveWithKeyboard(
  event: KeyboardEvent<HTMLButtonElement>,
  key: Target,
  layout: StoryLayout,
  change: (value: StoryLayout) => void,
) {
  const direction = {
    ArrowLeft: [-UI.KEY_STEP, 0],
    ArrowRight: [UI.KEY_STEP, 0],
    ArrowUp: [0, -UI.KEY_STEP],
    ArrowDown: [0, UI.KEY_STEP],
  }[event.key];
  if (!direction) return;
  event.preventDefault();
  change({
    ...layout,
    [key]: {
      x: bounded(layout[key].x + (direction[0] ?? 0)),
      y: bounded(layout[key].y + (direction[1] ?? 0)),
    },
  });
}
