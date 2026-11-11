import { cents } from './form-values';
import { text } from './form-values';
export function commercialFormInput(action: string, form: FormData, organizationId: string) {
  switch (action) {
    case 'redeem-online-voucher':
      return { organizationId, code: text(form, 'code') };
    case 'platform-cost':
      return {
        organizationId: text(form, 'costOrganizationId'),
        category: text(form, 'category'),
        amountCents: cents(text(form, 'costAmount')),
        sourceReference: text(form, 'sourceReference'),
        occurredAt: text(form, 'occurredOn') + 'T00:00:00.000Z',
      };
    case 'liberty-selection':
      return { organizationId, activityIds: form.getAll('activityIds').map(String) };
    default:
      return undefined;
  }
}
