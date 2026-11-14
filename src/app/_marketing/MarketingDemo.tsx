'use client';
import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from 'react';
import { MARKETING_PREVIEW as UI } from '../../config/marketing-preview';
import { INITIAL_DEMO, demoReducer, type DemoAction, type DemoState } from './demo-state';
import { useDemoPlayback } from './use-demo-playback';
const DemoContext = createContext<{
  readonly state: DemoState;
  readonly dispatch: Dispatch<DemoAction>;
} | null>(null);
export function MarketingDemo({ children }: { readonly children: ReactNode }) {
  const [state, dispatch] = useReducer(demoReducer, INITIAL_DEMO);
  useDemoPlayback(state, dispatch);
  return <DemoContext.Provider value={{ state, dispatch }}>{children}</DemoContext.Provider>;
}
export function useMarketingDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error('MarketingDemo provider is required');
  const example = UI.EXAMPLES[context.state.exampleIndex] ?? UI.EXAMPLES[0];
  const session = example.sessions[context.state.sessionIndex] ?? example.sessions[0];
  return { ...context, example, session };
}
