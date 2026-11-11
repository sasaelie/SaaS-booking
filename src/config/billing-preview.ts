export const BILLING_PREVIEW = {
  TEST: 'Vous êtes sur la version de test : aucun paiement ne sera demandé ni prélevé. Vous pouvez parcourir le récapitulatif ci-dessous.',
  OFFERED:
    'Cet espace bénéficie déjà d’un accès offert : vous n’avez rien à payer. Le parcours ci-dessous montre les tarifs et les étapes à titre de démonstration.',
  ACTION: 'Voir le récapitulatif de test',
  TITLE: 'Récapitulatif — démonstration',
  PLAN: 'Formule',
  INTERVAL: 'Facturation choisie',
  COMMERCIAL_PRICE: 'Tarif commercial',
  DUE: 'Montant à régler pour cet espace',
  TEST_DUE: 'Montant qui serait facturé en service',
  OFFERED_DUE: 'Accès offert : aucun abonnement payant à souscrire.',
  NEXT_TITLE: 'À quel moment payer ?',
  NEXT: 'En service, après ce récapitulatif, « Continuer vers le paiement sécurisé » ouvre Stripe. Vous y saisissez vos informations de paiement et confirmez le règlement. Studio Pro est activé après confirmation du paiement par Stripe.',
  BLOCKED:
    'Dans cette version de test, Stripe n’est pas raccordé pour facturer les abonnements. Ce récapitulatif n’active pas un abonnement et ne crée aucun paiement.',
  CLOSE: 'Revenir au choix de la formule',
  LIVE: 'Vous réglez sur la page Stripe qui s’ouvre après cette étape, puis l’abonnement est confirmé par Stripe.',
} as const;
