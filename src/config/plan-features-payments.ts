export const PAYMENT_FEATURES = [
  [
    'Abonnement de l’espace',
    'Chaque espace possède sa propre formule. Le prix affiché au participant reste le prix qu’il paie.',
    '0 € par mois',
    '29 € par mois ou 260 € par an',
  ],
  [
    'Frais de réservation',
    'Liberté déduit ses frais du prix public, sans supplément final. En Pro, les frais techniques Stripe restent distincts.',
    '3,5 % + 0,45 € par réservation payée, sans plafond',
    '0 € de commission de plateforme',
  ],
  [
    'Carte et Bancontact',
    'Encaissement via Stripe après raccordement et validation du compte de paiement. Aucun paiement réel dans cette recette.',
    'Inclus',
    'Inclus',
  ],
  [
    'Virements bancaires',
    'Nouvelles réservations par virement avec communication structurée belge Modulo 97, délai et instructions de règlement.',
    'Non pour les nouvelles réservations',
    'Inclus',
  ],
  [
    'Justificatifs de virement',
    'Dépôt par le participant, consultation et décision de l’organisateur. Les virements déjà engagés restent gérables après un retour en Liberté.',
    'Historique et virements déjà engagés',
    'Inclus',
  ],
  [
    'Règlement auprès de l’organisateur',
    'Inscription sans encaissement en ligne ; la réservation ne constitue pas une preuve de paiement.',
    'Activités gratuites uniquement',
    'Activités gratuites ou payantes',
  ],
  [
    'Comparaison des frais',
    'Compteur sur les 30 derniers jours : frais rapprochés, part évitable avec Pro et opérations encore en attente de rapprochement.',
    'Inclus',
    'Inclus',
  ],
  [
    'Export comptable complet',
    'Fichier exportable avec références, brut, commission, frais bancaires rapprochés et net ; un montant non encore connu reste signalé.',
    'Non',
    'Inclus',
  ],
] as const;
