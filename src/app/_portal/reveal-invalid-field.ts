import type { FormEvent } from 'react';
export function revealInvalidField(event: FormEvent<HTMLFormElement>) {
  const field = event.target;
  if (!(field instanceof HTMLElement)) return;
  let ancestor = field.parentElement;
  while (ancestor && ancestor !== event.currentTarget) {
    if (ancestor instanceof HTMLDetailsElement) ancestor.open = true;
    ancestor = ancestor.parentElement;
  }
  // Native validation emits one event per invalid field. Only focus the first one.
  if (event.currentTarget.querySelector(':invalid:not(fieldset)') === field) field.focus();
}
