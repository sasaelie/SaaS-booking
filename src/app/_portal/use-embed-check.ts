'use client';
import { useEffect, useRef, useState } from 'react';
import { EMBED } from '../../config/constants';
import { EMBED_HEALTH as H } from '../../config/embed-health';
import { embedReady } from '../../lib/embed-health';
type CheckState = 'idle' | 'loading' | 'ready' | 'unavailable' | 'failed';
export function useEmbedCheck(appUrl: string) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<CheckState>('idle');
  const origin = new URL(appUrl).origin;
  useEffect(() => {
    if (!attempt) return;
    let done = false;
    const timer = window.setTimeout(() => {
      done = true;
      setState('failed');
    }, H.TIMEOUT_MS);
    function receive(event: MessageEvent<unknown>) {
      const source = frame.current?.contentWindow;
      if (done || !source || event.source !== source || event.origin !== origin) return;
      const result = embedReady(event, source, origin);
      if (result) {
        done = true;
        clearTimeout(timer);
        setState(result);
      } else if (
        typeof event.data === 'object' &&
        event.data &&
        'type' in event.data &&
        event.data.type === EMBED.RESIZE_TYPE
      )
        source.postMessage({ type: H.PING, version: H.VERSION }, origin);
    }
    window.addEventListener('message', receive);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('message', receive);
    };
  }, [attempt, origin]);
  function start() {
    setState('loading');
    setAttempt((value) => value + 1);
  }
  return { frame, state, attempt, start };
}
