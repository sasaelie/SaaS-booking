import Link from 'next/link';
export function PortalMetric({
  label,
  value,
  href,
}: {
  readonly label: string;
  readonly value: number;
  readonly href?: string;
}) {
  const content = (
    <>
      <span>{label}</span>
      <strong>{value}</strong>
    </>
  );
  return href ? (
    <Link className="portal-panel portal-metric portal-metric-link" href={href}>
      {content}
    </Link>
  ) : (
    <div className="portal-panel portal-metric">{content}</div>
  );
}
