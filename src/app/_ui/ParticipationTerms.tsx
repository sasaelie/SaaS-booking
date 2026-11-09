import { SERVICE } from '../../config/service';
export function ParticipationTerms({ text }: { readonly text: string }) {
  return (
    <details id="participant-terms" className="event-information">
      <summary>{SERVICE.TERMS}</summary>
      <div className="ice-terms-text">{text}</div>
    </details>
  );
}
