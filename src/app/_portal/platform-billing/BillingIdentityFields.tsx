import type {
  BillingRecipient,
  PlatformBillingSettings,
} from '../../../core/validation/platform-billing';
import { PLATFORM_BILLING as UI } from '../../../config/platform-billing';
import { PortalField } from '../PortalField';
export function BillingIdentityFields({
  value,
  issuer = false,
}: {
  readonly value?: Partial<BillingRecipient & PlatformBillingSettings> | null;
  readonly issuer?: boolean;
}) {
  return (
    <div className="portal-form-grid">
      <PortalField
        label={UI.LEGAL_NAME}
        name="legalName"
        defaultValue={value?.legalName ?? ''}
        required
        maxLength={UI.MAX_NAME}
      />
      <PortalField
        label={UI.ADDRESS}
        name="address"
        defaultValue={value?.address ?? ''}
        required
        maxLength={UI.MAX_TEXT}
      />
      <BillingLegalFields value={value} issuer={issuer} />
      <PortalField
        label={UI.EMAIL}
        name="email"
        type="email"
        defaultValue={value?.email ?? ''}
        required={issuer}
      />
    </div>
  );
}

function BillingLegalFields({
  value,
  issuer,
}: {
  readonly value?: Partial<BillingRecipient & PlatformBillingSettings> | null;
  readonly issuer: boolean;
}) {
  return (
    <>
      <PortalField
        label={UI.COUNTRY}
        name="country"
        defaultValue={value?.country ?? ''}
        required
        minLength={2}
        maxLength={2}
        pattern="[A-Za-z]{2}"
      />
      {issuer ? (
        <PortalField
          label={UI.REGISTRATION}
          name="registrationNumber"
          defaultValue={value?.registrationNumber ?? ''}
          required
          maxLength={UI.MAX_NAME}
        />
      ) : null}
      <PortalField
        label={UI.VAT_NUMBER}
        name="vatNumber"
        defaultValue={value?.vatNumber ?? ''}
        maxLength={UI.MAX_NAME}
      />
    </>
  );
}
