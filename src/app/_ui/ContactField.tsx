import type { HTMLInputTypeAttribute } from 'react';
interface Props {
  readonly label: string;
  readonly name: string;
  readonly type?: HTMLInputTypeAttribute;
  readonly autoComplete?: string;
  readonly required?: boolean;
  readonly minLength?: number;
  readonly maxLength?: number;
}
export function ContactField(props: Props) {
  const { label, ...input } = props;
  return (
    <label>
      {label}
      <input className="ice-slot-pebble" {...input} />
    </label>
  );
}
