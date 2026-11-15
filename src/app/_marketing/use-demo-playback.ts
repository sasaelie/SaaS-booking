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
    const transition = state.transition;
    const action = transition === 'out' ? 'advance' : transition === 'in' ? 'settle' : 'exit';
    const delay =
      transition === 'out'
        ? MARKETING_DEMO.FADE_OUT_MS
        : transition === 'in'
          ? MARKETING_DEMO.FADE_IN_MS
          : scene.delayMs - MARKETING_DEMO.FADE_OUT_MS - MARKETING_DEMO.FADE_IN_MS;
    const timer = window.setTimeout(() => dispatch({ type: action }), delay);
    return () => window.clearTimeout(timer);
  }, [state.playing, state.phase, state.exampleIndex, state.transition, present, dispatch]);
  return state.playing && present;
}
