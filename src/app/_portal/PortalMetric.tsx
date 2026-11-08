export function PortalMetric({ label, value }: { readonly label: string; readonly value: number }) {
  return (
    <div className="portal-panel portal-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
