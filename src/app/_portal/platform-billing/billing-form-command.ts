import { PLATFORM_BILLING as UI } from '../../../config/platform-billing';
export function billingFormCommand(action: 'settings' | 'issue', form: FormData) {
  const value = (key: string) => String(form.get(key) ?? '').trim();
  const taxRateBps = Math.round(Number(value('taxPercent').replace(',', '.')) * UI.PERCENT_FACTOR);
  if (action === 'settings')
    return {
      legalName: value('legalName'),
      address: value('address'),
      country: value('country'),
      registrationNumber: value('registrationNumber'),
      vatNumber: value('vatNumber'),
      email: value('email'),
      taxRateBps,
      taxNote: value('taxNote'),
      prefix: value('prefix'),
    };
  const base = {
    kind: value('kind'),
    sourceId: value('sourceId'),
    confirmed: form.has('confirmed'),
  };
  return base.kind === 'CREDIT'
    ? base
    : {
        ...base,
        taxRateBps,
        taxNote: value('taxNote'),
        recipient: {
          legalName: value('legalName'),
          address: value('address'),
          country: value('country'),
          vatNumber: value('vatNumber'),
          email: value('email'),
        },
      };
}
