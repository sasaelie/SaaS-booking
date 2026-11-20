'use client';
import type { KeyboardEvent } from 'react';
import { ADMIN_CODES as C } from '../../../config/administrator-codes';
import type { AdministratorSecurityState } from '../../../core/ports/administrator-security';
export type SecurityMethod = 'passkey' | 'totp' | 'email';
type Props = {
  readonly method: SecurityMethod;
  readonly select: (method: SecurityMethod) => void;
  readonly state: AdministratorSecurityState;
};
export function MethodSelector({ method, select, state }: Props) {
  return (
    <div
      className="administrator-method-selector"
      role="tablist"
      aria-label={C.CHOOSE}
      onKeyDown={(event) => moveMethod(event, method, select)}
    >
      {C.TABS.map(([value, label]) => (
        <MethodTab
          key={value}
          value={value}
          label={label}
          selected={method === value}
          select={select}
          ready={isReady(value, state)}
        />
      ))}
    </div>
  );
}
function isReady(value: SecurityMethod, state: AdministratorSecurityState) {
  return Boolean(
    value === 'passkey'
      ? state.credentials.length
      : value === 'totp'
        ? state.totpEnabled
        : state.emailEnabled,
  );
}
type TabProps = {
  readonly value: SecurityMethod;
  readonly label: string;
  readonly selected: boolean;
  readonly select: (method: SecurityMethod) => void;
  readonly ready: boolean;
};
function MethodTab({ value, label, selected, select, ready }: TabProps) {
  return (
    <button
      className="liquid-ice-button portal-button"
      type="button"
      role="tab"
      tabIndex={selected ? 0 : -1}
      id={`security-tab-${value}`}
      aria-controls="security-method-content"
      aria-selected={selected}
      onClick={() => select(value)}
    >
      <span>{label}</span>
      <small>
        <span className="administrator-method-dot" data-ready={ready} aria-hidden="true" />
        {ready ? C.READY : C.NOT_CONFIGURED}
      </small>
    </button>
  );
}
function moveMethod(
  event: KeyboardEvent<HTMLDivElement>,
  method: SecurityMethod,
  select: (value: SecurityMethod) => void,
) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  event.preventDefault();
  const index = C.TABS.findIndex(([value]) => value === method),
    length = C.TABS.length;
  const position =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? length - 1
        : (index + (event.key === 'ArrowLeft' ? -1 : 1) + length) % length;
  const next = C.TABS[position]?.[0];
  if (!next) return;
  select(next);
  document.getElementById(`security-tab-${next}`)?.focus();
}
