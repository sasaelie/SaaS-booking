import Link from 'next/link';
import { headers } from 'next/headers';
import { simulation } from '../../composition/simulation';
import { DASHBOARD } from '../../config/dashboard';
import { simulationPath } from '../../config/simulation';
export async function DashboardTests({ id }: { readonly id: string }) {
  const app = await simulation(await headers(), id);
  const result = app.ok ? await app.value.tests.count() : null;
  const count = result?.ok ? result.value : null;
  return (
    <aside className="dashboard-tests portal-panel">
      <div>
        <h2>
          {DASHBOARD.TESTS}
          {count !== null ? ` · ${count}` : ''}
        </h2>
        <p className="portal-muted">{DASHBOARD.TEST_NOTE}</p>
        {count === null ? <p role="status">{DASHBOARD.TEST_UNAVAILABLE}</p> : null}
      </div>
      <div className="dashboard-test-actions">
        <Link className="dashboard-test-list" href={`/app/${id}/tests`}>
          {DASHBOARD.TEST_OPEN}
        </Link>
        <Link className="dashboard-test-start" href={simulationPath(id)}>
          {DASHBOARD.TEST_START}
        </Link>
      </div>
    </aside>
  );
}
