import { ADMIN, ADMIN_JOBS } from '../../config/administration';
import {
  ADMIN_WORKSPACE as UI,
  type AdministrationSearchParams,
} from '../../config/administration-workspace';
import { PortalField } from './PortalField';
import { PortalSelect } from './PortalSelect';
type Mode = 'organizations' | 'operations' | 'history';
export function AdministrationSearch({
  search,
  filter = {},
  mode = 'organizations',
}: {
  readonly search?: string;
  readonly filter?: AdministrationSearchParams;
  readonly mode?: Mode;
}) {
  const statuses = mode === 'operations' ? UI.OPERATION_FILTERS : UI.ACCESS_FILTERS;
  return (
    <form className="administration-search" method="get">
      <div className="administration-search-primary">
        <PortalField
          label={ADMIN.SEARCH}
          name="search"
          defaultValue={filter.search ?? search ?? ''}
        />
        {mode !== 'history' ? (
          <PortalSelect label={UI.STATUS} name="status" defaultValue={filter.status ?? ''}>
            {statuses.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </PortalSelect>
        ) : null}
        <button className="liquid-ice-button portal-button">{ADMIN.FILTER}</button>
      </div>
      <details className="administration-filter-more">
        <summary>{UI.MORE}</summary>
        <MoreFilters filter={filter} mode={mode} />
      </details>
    </form>
  );
}
function MoreFilters({
  filter,
  mode,
}: {
  readonly filter: AdministrationSearchParams;
  readonly mode: Mode;
}) {
  const sorts =
    mode === 'operations'
      ? UI.OPERATION_SORTS
      : mode === 'history'
        ? UI.HISTORY_SORTS
        : UI.ORGANIZATION_SORTS;
  return (
    <div className="administration-search-more">
      {mode === 'organizations' ? (
        <Options label={UI.PLAN} name="plan" value={filter.plan ?? ''} options={UI.PLAN_FILTERS} />
      ) : null}
      {mode === 'operations' ? (
        <Options
          label={UI.TYPE}
          name="type"
          value={filter.type ?? ''}
          options={[['', UI.ALL], ...Object.entries(ADMIN_JOBS)]}
        />
      ) : null}
      <Options label={UI.SORT} name="sort" value={filter.sort ?? sorts[0][0]} options={sorts} />
      <Options
        label={UI.SIZE}
        name="pageSize"
        value={filter.pageSize ?? String(UI.PAGE_SIZES[0])}
        options={UI.PAGE_SIZES.map((value) => [String(value), String(value)] as const)}
      />
    </div>
  );
}
function Options({
  label,
  name,
  value,
  options,
}: {
  readonly label: string;
  readonly name: string;
  readonly value: string;
  readonly options: readonly (readonly [string, string])[];
}) {
  return (
    <PortalSelect label={label} name={name} defaultValue={value}>
      {options.map(([key, text]) => (
        <option key={key} value={key}>
          {text}
        </option>
      ))}
    </PortalSelect>
  );
}
