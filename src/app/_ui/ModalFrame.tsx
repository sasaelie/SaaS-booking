'use client';
import { useEffect, useId, useRef, type ReactNode } from 'react';
interface ModalProps {
  readonly open: boolean;
  readonly title: string;
  readonly busy?: boolean;
  readonly onClose: () => void;
  readonly children: ReactNode;
}
export function ModalFrame({ open, title, busy = false, onClose, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (open && dialog && !dialog.open) {
      dialog.showModal();
      heading.current?.focus({ preventScroll: true });
      dialog.scrollTop = 0;
    } else if (!open && dialog?.open) dialog.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className="ice-cube-shell portal-dialog"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <h2 id={titleId} ref={heading} tabIndex={-1}>
        {title}
      </h2>
      {children}
    </dialog>
  );
}
