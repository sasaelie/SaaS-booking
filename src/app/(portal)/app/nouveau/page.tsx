import { PORTAL } from '../../../../config/constants';
import { PortalHeading } from '../../../_portal/PortalHeading';
import { CreateOrganizationForm } from '../../../_portal/CreateOrganizationForm';
export default function Page() {
  return (
    <>
      <PortalHeading title={PORTAL.CREATE_ORGANIZATION} description={PORTAL.WELCOME_HINT} />
      <CreateOrganizationForm />
    </>
  );
}
