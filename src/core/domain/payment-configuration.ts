import { PAYMENT_MODES, type PaymentMode } from '../../config/constants';
interface OrganizationPaymentSettings {
  readonly stripeReady: boolean;
  readonly merchantAccountId: string | null;
  readonly usesPlatformPayments: boolean;
  readonly bankIban: string | null;
  readonly bankAccountName: string | null;
}
export function hasPaymentConfiguration(
  mode: PaymentMode,
  settings: OrganizationPaymentSettings,
): boolean {
  if (mode === PAYMENT_MODES.STRIPE)
    return (
      settings.stripeReady && Boolean(settings.merchantAccountId || settings.usesPlatformPayments)
    );
  if (mode === PAYMENT_MODES.BANK_TRANSFER)
    return Boolean(settings.bankIban && settings.bankAccountName);
  return true;
}
