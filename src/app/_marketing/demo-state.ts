import { MARKETING_PREVIEW } from '../../config/marketing-preview';
import { MARKETING_DEMO, type DemoPhase } from '../../config/marketing-demo';
export interface DemoState {
  readonly exampleIndex: number;
  readonly sessionIndex: number;
  readonly phase: DemoPhase;
  readonly playing: boolean;
  readonly transition: 'idle' | 'out' | 'in';
}
export type DemoAction =
  | { readonly type: 'example'; readonly index: number }
  | { readonly type: 'session'; readonly index: number }
  | { readonly type: 'pause' | 'play' | 'book' | 'advance' | 'exit' | 'settle' };
export const INITIAL_DEMO: DemoState = {
  exampleIndex: 0,
  sessionIndex: 0,
  phase: 'draft',
  playing: true,
  transition: 'idle',
};
export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case 'example':
      return {
        ...state,
        exampleIndex: action.index,
        sessionIndex: 0,
        phase: 'published',
        transition: 'idle',
      };
    case 'session':
      return { ...state, sessionIndex: action.index, phase: 'selected', transition: 'idle' };
    case 'pause':
      return { ...state, playing: false, transition: 'idle' };
    case 'play':
      return { ...state, playing: true, transition: 'idle' };
    case 'book':
      return { ...state, phase: 'booked', transition: 'idle' };
    case 'exit':
      return { ...state, transition: 'out' };
    case 'settle':
      return state.transition === 'idle' ? state : { ...state, transition: 'idle' };
    case 'advance':
      return advanceDemo(state);
  }
}
function advanceDemo(state: DemoState): DemoState {
  const index = MARKETING_DEMO.STEPS.findIndex((step) => step.key === state.phase);
  const next = MARKETING_DEMO.STEPS[index + 1];
  if (!next)
    return {
      ...INITIAL_DEMO,
      playing: state.playing,
      transition: 'in',
      exampleIndex: (state.exampleIndex + 1) % MARKETING_PREVIEW.EXAMPLES.length,
    };
  return {
    ...state,
    transition: 'in',
    phase: next.key,
    sessionIndex: next.key === 'selected' ? 1 : state.sessionIndex,
  };
}
