import { SHARE_UI } from '../../config/constants';
import { PortalForm } from './PortalForm';
export function TestBookingPublication({ organizationId }: { readonly organizationId: string }) {
  return (
    <section className="sharing-content">
      <h2>{SHARE_UI.TEST_ACTIVATE_TITLE}</h2>
      <p>{SHARE_UI.TEST_ACTIVATE_HINT}</p>
      <PortalForm
        action="publish-test-booking"
        organizationId={organizationId}
        submitLabel={SHARE_UI.TEST_ACTIVATE}
      >
        <label className="portal-check">
          <input type="checkbox" name="acknowledged" required />
          <span>{SHARE_UI.TEST_ACKNOWLEDGE}</span>
        </label>
      </PortalForm>
    </section>
  );
}
