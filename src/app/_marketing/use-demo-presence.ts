'use client';
import { useEffect, useState } from 'react';
export function useDemoPresence() {
  const [visible, setVisible] = useState(false);
  const [foreground, setForeground] = useState(true);
  const [keyboard, setKeyboard] = useState(false);
  useEffect(() => {
    const states = new Map<Element, boolean>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) states.set(entry.target, entry.isIntersecting);
      setVisible([...states.values()].some(Boolean));
    });
    document
      .querySelectorAll('[data-booking-demo]')
      .forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const visibility = () => setForeground(!document.hidden);
    const focus = (event: FocusEvent) =>
      setKeyboard(
        isDemoKeyboardTarget(event.type === 'focusout' ? event.relatedTarget : event.target),
      );
    const pointer = () => setKeyboard(false);
    visibility();
    document.addEventListener('visibilitychange', visibility);
    document.addEventListener('focusin', focus);
    document.addEventListener('focusout', focus);
    document.addEventListener('pointerdown', pointer);
    return () => {
      document.removeEventListener('visibilitychange', visibility);
      document.removeEventListener('focusin', focus);
      document.removeEventListener('focusout', focus);
      document.removeEventListener('pointerdown', pointer);
    };
  }, []);
  return visible && foreground && !keyboard;
}
function isDemoKeyboardTarget(target: EventTarget | null) {
  return (
    target instanceof Element &&
    target.matches('input:focus-visible, button:focus-visible, a:focus-visible') &&
    Boolean(target.closest('[data-booking-demo]')) &&
    !target.closest('[data-demo-playback]')
  );
}
