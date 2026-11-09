import { ADMIN } from '../../config/administration';
import { PortalField } from './PortalField';
export function AdministrationSearch({ search }: { readonly search?: string }) {
  return (
    <form className="portal-filters administration-search" method="get">
      <PortalField label={ADMIN.SEARCH} name="search" defaultValue={search ?? ''} />
      <button className="liquid-ice-button portal-button">{ADMIN.FILTER}</button>
    </form>
  );
}
