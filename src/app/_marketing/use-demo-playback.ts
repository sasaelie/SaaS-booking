'use client';
import { useEffect, type Dispatch } from 'react';
import { MARKETING_DEMO } from '../../config/marketing-demo';
import type { DemoAction, DemoState } from './demo-state';
import { useDemoPresence } from './use-demo-presence';
export function useDemoPlayback(state: DemoState, dispatch: Dispatch<DemoAction>) {
  const present = useDemoPresence();
  useEffect(() => {
    if (!state.playing || !present) {
      if (state.transition !== 'idle') dispatch({ type: 'settle' });
      return;
    }
    const scene =
      MARKETING_DEMO.STEPS.find((step) => step.key === state.phase) ?? MARKETING_DEMO.STEPS[0];
    if (state.transition !== 'idle') return finishDemoTransition(state.transition, dispatch);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const delay = reduced
      ? scene.delayMs
      : scene.delayMs - MARKETING_DEMO.FADE_OUT_MS - MARKETING_DEMO.FADE_IN_MS;
    const timer = window.setTimeout(() => dispatch({ type: 'exit' }), delay);
    return () => window.clearTimeout(timer);
  }, [state.playing, state.phase, state.exampleIndex, state.transition, present, dispatch]);
  return state.playing && present;
}
function finishDemoTransition(transition: 'out' | 'in', dispatch: Dispatch<DemoAction>) {
  let cancelled = false;
  const name = transition === 'out' ? 'demo-fade-out' : 'demo-fade-in';
  const animations = [
    ...document.querySelectorAll('.marketing-demo-fade, .marketing-demo-photo-blend'),
  ]
    .flatMap((element) => element.getAnimations())
    .filter(
      (animation) =>
        animation instanceof CSSAnimation &&
        (animation.animationName === name ||
          (transition === 'in' && animation.animationName === 'demo-photo-blend')),
    );
  void Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
    if (!cancelled && !document.hidden)
      dispatch({ type: transition === 'out' ? 'advance' : 'settle' });
  });
  return () => {
    cancelled = true;
  };
}
