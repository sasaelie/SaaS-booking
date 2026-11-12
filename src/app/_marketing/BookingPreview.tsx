'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { MARKETING_PREVIEW as UI } from '../../config/marketing-preview';
import { IceIcon } from '../_ui/IceIcon';
import { formatMoney } from '../_ui/format-money';
type Example = (typeof UI.EXAMPLES)[number];
export function BookingPreview({ connected }: { readonly connected: boolean }) {
  const [example, setExample] = useState<Example>(UI.EXAMPLES[0]);
  const [session, setSession] = useState<string>(example.sessions[0]);
  return (
    <div className="marketing-preview-wrap">
      <div className="marketing-preview-caption">
        <span>{UI.LABEL}</span>
        <IceIcon name="arrow" />
      </div>
      <div className="portal-panel marketing-preview">
        <PreviewSwitch
          selected={example.key}
          onSelect={(item) => {
            setExample(item);
            setSession(item.sessions[0]);
          }}
        />
        <PreviewActivity example={example} />
        <PreviewSessions example={example} selected={session} onSelect={setSession} />
        <p className="ice-sr-only" role="status">
          {UI.SELECTED} : {session}
        </p>
        <Link
          className="liquid-ice-button portal-button marketing-preview-cta"
          href={connected ? '/app' : '/inscription'}
        >
          {connected ? UI.CONNECTED_ACTION : UI.ACTION}
          <IceIcon name="arrow" />
        </Link>
      </div>
      <p className="marketing-preview-note">{UI.FICTION}</p>
    </div>
  );
}
function PreviewSessions({
  example,
  selected,
  onSelect,
}: {
  readonly example: Example;
  readonly selected: string;
  readonly onSelect: (session: string) => void;
}) {
  return (
    <fieldset className="marketing-preview-sessions">
      <legend>{UI.DATE}</legend>
      {example.sessions.map((time) => (
        <label key={time}>
          <input
            type="radio"
            name="example-session"
            checked={time === selected}
            onChange={() => onSelect(time)}
          />
          <span>{time}</span>
          <IceIcon name="check" />
        </label>
      ))}
    </fieldset>
  );
}
function PreviewSwitch({
  selected,
  onSelect,
}: {
  readonly selected: string;
  readonly onSelect: (example: Example) => void;
}) {
  return (
    <fieldset className="marketing-preview-switch">
      <legend className="ice-sr-only">{UI.CHOOSE}</legend>
      {UI.EXAMPLES.map((item) => (
        <label key={item.key}>
          <input
            type="radio"
            name="example"
            value={item.key}
            checked={selected === item.key}
            onChange={() => onSelect(item)}
          />
          <span>{item.label}</span>
        </label>
      ))}
    </fieldset>
  );
}
function PreviewActivity({ example }: { readonly example: Example }) {
  return (
    <>
      <div className="marketing-preview-identity">
        <span className="marketing-preview-avatar">{example.initials}</span>
        <div>
          <strong>{example.organization}</strong>
          <small>{UI.ONLINE}</small>
        </div>
        <IceIcon name="lock" />
      </div>
      <div className="marketing-preview-activity" data-example={example.key}>
        <Image
          className="marketing-preview-photo"
          src={example.image}
          alt=""
          fill
          loading="eager"
          sizes="(max-width: 760px) 380px, 440px"
        />
        <p className="marketing-preview-tag">{example.tag}</p>
        <h2>{example.title}</h2>
        <p>{example.text}</p>
        <div className="marketing-preview-price">
          <strong>{formatMoney(example.priceCents, 'EUR')}</strong>
          <span>{UI.TOTAL}</span>
        </div>
      </div>
      <p className="marketing-preview-availability">
        <span aria-hidden="true" />
        {example.availability}
      </p>
    </>
  );
}
