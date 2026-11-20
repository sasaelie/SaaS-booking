import type { CSSProperties } from 'react';
import { PLATFORM_REPORTING as UI } from '../../config/platform-reporting';
type Point = { readonly day: string; readonly count: number };
export function PlatformUsageChart({ daily }: { readonly daily: readonly Point[] }) {
  const points = chartPoints(daily);
  const maximum = Math.max(1, ...points.map((point) => point.count));
  return (
    <section className="portal-panel administration-usage-figure">
      <h2>{UI.DAILY}</h2>
      {daily.some((point) => point.count) ? (
        <div className="administration-usage-chart" role="img" aria-label={UI.DAILY}>
          {points.map((point) => (
            <span
              key={point.day}
              title={`${point.day} : ${point.count}`}
              style={
                {
                  '--usage-height': `${(point.count / maximum) * UI.CHART_PERCENT}%`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      ) : (
        <p className="portal-muted">{UI.ZERO_ACTIVITY}</p>
      )}
      <details className="administration-row-details">
        <summary>{UI.TABLE}</summary>
        <UsageTable daily={daily} />
      </details>
    </section>
  );
}
function chartPoints(daily: readonly Point[]): readonly Point[] {
  if (daily.length <= UI.CHART_DAYS_MAX) return daily;
  const grouped = new Map<string, number>();
  for (const point of daily) {
    const month = point.day.slice(0, UI.MONTH_LABEL_LENGTH);
    grouped.set(month, (grouped.get(month) ?? 0) + point.count);
  }
  return [...grouped].map(([day, count]) => ({ day, count }));
}

function UsageTable({ daily }: { readonly daily: readonly Point[] }) {
  return (
    <table className="administration-usage-table">
      <thead>
        <tr>
          <th>{UI.DATE}</th>
          <th>{UI.CONFIRMED}</th>
        </tr>
      </thead>
      <tbody>
        {daily.map((point) => (
          <tr key={point.day}>
            <td>{point.day}</td>
            <td>{point.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
