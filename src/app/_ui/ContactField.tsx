import { useId, type HTMLInputTypeAttribute } from 'react';
interface Props {
  readonly label: string;
  readonly name: string;
  readonly type?: HTMLInputTypeAttribute;
  readonly autoComplete?: string;
  readonly required?: boolean;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly hint?: string;
}
export function ContactField(props: Props) {
  const { label, hint, ...input } = props;
  const id = useId();
  return (
    <div className="ice-field" data-field={props.name}>
      <label htmlFor={id}>
        {label}
        {props.required ? <span aria-hidden="true"> *</span> : null}
      </label>
      <input
        id={id}
        className="ice-slot-pebble"
        aria-describedby={hint ? `${id}-hint` : undefined}
        {...input}
      />
      {hint ? <small id={`${id}-hint`}>{hint}</small> : null}
    </div>
  );
}
