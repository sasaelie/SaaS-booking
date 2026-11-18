import type { PlatformBillingSettings as Settings } from '../../../core/validation/platform-billing';
import { PLATFORM_BILLING as UI } from '../../../config/platform-billing';
import { PlatformBillingForm } from './PlatformBillingForm';
import { BillingIdentityFields } from './BillingIdentityFields';
import { PortalField } from '../PortalField';
import { PlatformTransmissionNotice } from './PlatformTransmissionNotice';
export function PlatformBillingSettings({ settings }: { readonly settings: Settings | null }) {
  return (
    <section className="portal-panel">
      <h2>{UI.SETTINGS}</h2>
      <p className="portal-muted">{UI.SETTINGS_NOTE}</p>
      <PlatformBillingForm action="settings" label={UI.SAVE}>
        <BillingIdentityFields value={settings ?? { country: 'BE' }} issuer />
        <div className="portal-form-grid">
          <PortalField
            label={UI.VAT_RATE}
            name="taxPercent"
            type="number"
            min={0}
            max={UI.MAX_PERCENT}
            step="0.01"
            defaultValue={settings ? settings.taxRateBps / UI.PERCENT_FACTOR : ''}
            required
          />
          <PortalField
            label={UI.VAT_NOTE}
            name="taxNote"
            defaultValue={settings?.taxNote ?? ''}
            maxLength={UI.MAX_TEXT}
          />
          <PortalField
            label={UI.PREFIX}
            name="prefix"
            defaultValue={settings?.prefix ?? UI.DEFAULT_PREFIX}
            required
            pattern="[A-Za-z][A-Za-z0-9-]{1,14}"
          />
        </div>
        <p className="portal-muted">{UI.TAX_HINT}</p>
      </PlatformBillingForm>
      <PlatformTransmissionNotice />
    </section>
  );
}
