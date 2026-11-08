export const STAGING = {
  MODE: 'staging',
  DISABLED: 'false',
  NOTICE: 'Environnement de test — aucun paiement réel. Stripe et Mollie sont désactivés.',
  PAYMENT_NOTE:
    'Les connexions Stripe et Mollie seront configurées plus tard. Les réservations sans paiement en ligne restent testables.',
  SUBSCRIPTION_NOTE:
    'Aucun abonnement ne sera facturé dans cet environnement. L’administrateur peut accorder un accès offert pour tester les activités.',
} as const;

export function paymentsEnabled(environment: { readonly PAYMENTS_ENABLED?: string }): boolean {
  return environment.PAYMENTS_ENABLED !== STAGING.DISABLED;
}
