'use client';
import { useEffect, type Dispatch } from 'react';
import { MARKETING_DEMO } from '../../config/marketing-demo';
import type { DemoAction, DemoState } from './demo-state';
import { useDemoPresence } from './use-demo-presence';
export function useDemoPlayback(state: DemoState, dispatch: Dispatch<DemoAction>) {
  const present = useDemoPresence();
  useEffect(() => {
    if (!state.playing || !present) return;
    const scene =
      MARKETING_DEMO.STEPS.find((step) => step.key === state.phase) ?? MARKETING_DEMO.STEPS[0];
    const timer = window.setTimeout(() => dispatch({ type: 'advance' }), scene.delayMs);
    return () => window.clearTimeout(timer);
  }, [state.playing, state.phase, state.exampleIndex, present, dispatch]);
  return state.playing && present;
}
