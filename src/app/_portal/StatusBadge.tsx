import type { StatusIndicator } from '../../core/domain/status-indicator';
export function StatusBadge({ status }: { readonly status: StatusIndicator }) {
  return (
    <span className="status-badge" data-tone={status.tone}>
      {status.label}
    </span>
  );
}
