'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { SESSION_EXIT as UI } from '../../config/session-exit';
import { PORTAL } from '../../config/constants';
import { ModalFrame } from '../_ui/ModalFrame';
import { signOutRequest } from './sign-out-request';
import {
  rememberExitSource,
  shouldConfirmHistoryExit,
  wasHistoryNavigation,
} from './session-exit-navigation';
export function SessionExitGuard() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [historyExit, setHistoryExit] = useState(false);
  useExitNavigation((fromHistory) => {
    setFailed(false);
    setHistoryExit(fromHistory);
    setOpen(true);
  });
  function cancel() {
    if (historyExit) {
      window.location.replace('/app');
      return;
    }
    setOpen(false);
  }
  async function confirm() {
    if (pending) return;
    setPending(true);
    if (await signOutRequest()) {
      window.location.replace('/');
      return;
    }
    setPending(false);
    setFailed(true);
  }
  return (
    <ModalFrame open={open} title={UI.TITLE} busy={pending} onClose={cancel}>
      <p>{UI.MESSAGE}</p>
      {failed ? <p role="alert">{PORTAL.ERROR}</p> : null}
      <ExitActions pending={pending} cancel={cancel} confirm={confirm} />
    </ModalFrame>
  );
}
function ExitActions({
  pending,
  cancel,
  confirm,
}: {
  readonly pending: boolean;
  readonly cancel: () => void;
  readonly confirm: () => void;
}) {
  return (
    <div className="portal-dialog-actions">
      <button type="button" className="portal-secondary-action" onClick={cancel} disabled={pending}>
        {UI.CANCEL}
      </button>
      <button
        type="button"
        className="liquid-ice-button portal-button"
        onClick={confirm}
        disabled={pending}
      >
        {pending ? UI.PENDING : UI.CONFIRM}
      </button>
    </div>
  );
}
function useExitNavigation(open: (fromHistory: boolean) => void) {
  const path = usePathname();
  const current = useRef(path);
  const callback = useRef(open);
  useEffect(() => {
    callback.current = open;
  }, [open]);
  useEffect(() => {
    if (path === '/' && wasHistoryNavigation() && shouldConfirmHistoryExit(current.current))
      callback.current(true);
    rememberExitSource(path);
    current.current = path;
  }, [path]);
  useEffect(() => {
    function request() {
      callback.current(false);
    }
    function returned() {
      if (shouldConfirmHistoryExit(current.current)) callback.current(true);
    }
    function restored(event: PageTransitionEvent) {
      if (event.persisted) returned();
    }
    window.addEventListener(UI.EVENT, request);
    window.addEventListener('popstate', returned);
    window.addEventListener('pageshow', restored);
    return () => {
      window.removeEventListener(UI.EVENT, request);
      window.removeEventListener('popstate', returned);
      window.removeEventListener('pageshow', restored);
    };
  }, []);
}
