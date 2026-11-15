import { MARKETING_DEMO } from '../../config/marketing-demo';
import { MARKETING_PREVIEW } from '../../config/marketing-preview';
import { demoReducer, type DemoState } from './demo-state';
type DemoField = keyof ReturnType<typeof snapshot>;
export function demoTransitions(state: DemoState): Record<DemoField, DemoState['transition']> {
  const before = snapshot(state.transition === 'in' ? previousState(state) : state);
  const after = snapshot(
    state.transition === 'out' ? demoReducer(state, { type: 'advance' }) : state,
  );
  const fade = (field: DemoField) => (before[field] === after[field] ? 'idle' : state.transition);
  return {
    activity: fade('activity'),
    publication: fade('publication'),
    availability: fade('availability'),
    availabilityLabel: fade('availabilityLabel'),
    confirmation: fade('confirmation'),
    actor: fade('actor'),
    label: fade('label'),
    status: fade('status'),
    date: fade('date'),
    time: fade('time'),
  };
}
function snapshot(state: DemoState) {
  const example = MARKETING_PREVIEW.EXAMPLES[state.exampleIndex] ?? MARKETING_PREVIEW.EXAMPLES[0];
  const session = example.sessions[state.sessionIndex] ?? example.sessions[0];
  const scene =
    MARKETING_DEMO.STEPS.find((step) => step.key === state.phase) ?? MARKETING_DEMO.STEPS[0];
  const available = example.capacity - (state.phase === 'booked' ? 1 : 0);
  return {
    activity: example.key,
    publication: state.phase === 'draft',
    availability: available,
    availabilityLabel: available === 1 ? MARKETING_DEMO.PLACE : MARKETING_DEMO.PLACES,
    confirmation: state.phase === 'booked',
    actor: scene.actor,
    label: scene.label,
    status: scene.status,
    date: session.fullDate,
    time: `${session.label} – ${session.end}`,
  };
}
function previousState(state: DemoState): DemoState {
  const index = MARKETING_DEMO.STEPS.findIndex((step) => step.key === state.phase);
  const previous = MARKETING_DEMO.STEPS[index - 1];
  return {
    ...state,
    phase: previous?.key ?? 'booked',
    exampleIndex: previous
      ? state.exampleIndex
      : (state.exampleIndex + MARKETING_PREVIEW.EXAMPLES.length - 1) %
        MARKETING_PREVIEW.EXAMPLES.length,
    sessionIndex: previous ? (state.phase === 'selected' ? 0 : state.sessionIndex) : 1,
  };
}
