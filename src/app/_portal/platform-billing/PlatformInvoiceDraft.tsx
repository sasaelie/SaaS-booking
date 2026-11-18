'use client';
import { useState } from 'react';
import type { PlatformBillableSource } from '../../../core/ports/platform-billing';
import type { PlatformBillingSettings } from '../../../core/validation/platform-billing';
import { PLATFORM_BILLING as UI } from '../../../config/platform-billing';
import { invoiceAmounts } from '../../../core/domain/platform-invoice';
import { formatMoney } from '../../../lib/format-money';
import { PlatformBillingForm } from './PlatformBillingForm';
import { BillingIdentityFields } from './BillingIdentityFields';
import { PortalField } from '../PortalField';
export function PlatformInvoiceDraft({
  source,
  settings,
}: {
  readonly source: PlatformBillableSource;
  readonly settings: PlatformBillingSettings;
}) {
  return (
    <section className="portal-panel administration-invoice-draft">
      <h2>{source.kind === 'INVOICE' ? UI.SOURCE : UI.CREDIT}</h2>
      <p>
        {source.organizationName} · {formatMoney(source.amountCents, UI.CURRENCY)}
      </p>
      <PlatformBillingForm
        action="issue"
        label={source.kind === 'INVOICE' ? UI.ISSUE : UI.ISSUE_CREDIT}
      >
        <input type="hidden" name="kind" value={source.kind} />
        <input type="hidden" name="sourceId" value={source.id} />
        {source.kind === 'INVOICE' ? (
          <>
            <BillingIdentityFields
              value={{ legalName: source.organizationName, email: source.ownerEmail ?? '' }}
            />
            <InvoiceTaxFields source={source} settings={settings} />
          </>
        ) : (
          <p className="portal-muted">
            {UI.ORIGINAL} : {source.original?.number} · {source.original?.recipient.legalName}
          </p>
        )}
        <label className="portal-check">
          <input type="checkbox" name="confirmed" required />
          {UI.CONFIRM}
        </label>
        <p className="portal-muted">{UI.IMMUTABLE}</p>
      </PlatformBillingForm>
    </section>
  );
}

function InvoiceTaxFields({
  source,
  settings,
}: {
  readonly source: PlatformBillableSource;
  readonly settings: PlatformBillingSettings;
}) {
  const [rate, setRate] = useState(String(settings.taxRateBps / UI.PERCENT_FACTOR));
  const amounts = invoiceAmounts(source.amountCents, Math.round(Number(rate) * UI.PERCENT_FACTOR));
  return (
    <>
      <PortalField
        label={UI.VAT_RATE}
        name="taxPercent"
        type="number"
        min={0}
        max={UI.MAX_PERCENT}
        step="0.01"
        value={rate}
        onChange={(event) => setRate(event.currentTarget.value)}
        required
      />
      <PortalField
        label={UI.VAT_NOTE}
        name="taxNote"
        defaultValue={settings.taxNote}
        maxLength={UI.MAX_TEXT}
      />
      <p className="portal-muted">{UI.TAX_HINT}</p>
      <p className="portal-muted">
        {UI.NET} : {amounts.ok ? formatMoney(amounts.value.netCents, UI.CURRENCY) : '—'} · {UI.TAX}{' '}
        : {amounts.ok ? formatMoney(amounts.value.taxCents, UI.CURRENCY) : '—'}
      </p>
    </>
  );
}
