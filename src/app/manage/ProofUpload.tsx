'use client';
import { useId, useState, type FormEvent } from 'react';
import { FORM_LABELS, PAYMENT_RULES } from '../../config/constants';
export function ProofUpload({
  submit,
  pending,
}: {
  readonly submit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  readonly pending: boolean;
}) {
  const id = useId();
  const [fileName, setFileName] = useState('');
  return (
    <form onSubmit={submit} className="manage-upload">
      <h2>{FORM_LABELS.PROOF}</h2>
      <p id={`${id}-hint`}>{FORM_LABELS.PROOF_HINT}</p>
      <label className="manage-file" htmlFor={id}>
        <span>{FORM_LABELS.CHOOSE_IMAGE}</span>
        <input
          id={id}
          type="file"
          name="proof"
          accept={PAYMENT_RULES.ALLOWED_PROOF_MIME_TYPES.join(',')}
          required
          aria-describedby={`${id}-hint`}
          onChange={(event) => setFileName(event.currentTarget.files?.[0]?.name ?? '')}
        />
      </label>
      <small className="manage-file-name">{fileName || FORM_LABELS.NO_IMAGE}</small>
      <button className="liquid-ice-button" disabled={pending || !fileName}>
        {pending ? FORM_LABELS.SUBMITTING : FORM_LABELS.UPLOAD}
      </button>
    </form>
  );
}
