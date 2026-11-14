import { MARKETING_PREVIEW } from '../../config/marketing-preview';
export interface DemoState {
  readonly exampleIndex: number;
  readonly sessionIndex: number;
  readonly booked: boolean;
  readonly playing: boolean;
}
export type DemoAction =
  | { readonly type: 'example'; readonly index: number }
  | { readonly type: 'session'; readonly index: number }
  | { readonly type: 'pause' | 'play' | 'book' | 'next' };
export const INITIAL_DEMO: DemoState = {
  exampleIndex: 0,
  sessionIndex: 0,
  booked: false,
  playing: false,
};
export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case 'example':
      return { ...INITIAL_DEMO, exampleIndex: action.index };
    case 'session':
      return { ...state, sessionIndex: action.index, booked: false, playing: false };
    case 'pause':
      return state.playing ? { ...state, playing: false } : state;
    case 'play':
      return { ...state, playing: true };
    case 'book':
      return { ...state, booked: true };
    case 'next':
      return {
        ...INITIAL_DEMO,
        playing: true,
        exampleIndex: (state.exampleIndex + 1) % MARKETING_PREVIEW.EXAMPLES.length,
      };
  }
}
