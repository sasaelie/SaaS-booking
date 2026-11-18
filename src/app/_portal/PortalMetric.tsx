import type { StatusTone } from '../../core/domain/status-indicator';
import { PressableLink as Link } from '../_ui/PressableLink';
export function PortalMetric({
  label,
  value,
  href,
  tone,
}: {
  readonly label: string;
  readonly value: number;
  readonly href?: string;
  readonly tone?: StatusTone;
}) {
  const content = (
    <>
      <span>{label}</span>
      <strong>{value}</strong>
    </>
  );
  return href ? (
    <Link
      className="portal-panel portal-metric portal-metric-link liquid-ice-button"
      href={href}
      data-attention={value > 0}
      data-tone={tone}
    >
      {content}
    </Link>
  ) : (
    <div className="portal-panel portal-metric" data-tone={tone}>
      {content}
    </div>
  );
}
