import type { ReactNode } from 'react';
import { IceIcon } from '../_ui/IceIcon';
export function PortalEmpty({
  title,
  description,
  children,
}: {
  readonly title: string;
  readonly description?: string;
  readonly children?: ReactNode;
}) {
  return (
    <section className="portal-panel portal-empty">
      <span className="portal-empty-icon">
        <IceIcon name="calendar" />
      </span>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {children}
    </section>
  );
}
