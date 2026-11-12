import { ACTIVITY_FEATURES, PARTICIPANT_FEATURES } from './plan-features-activities';
import { PAYMENT_FEATURES } from './plan-features-payments';
import { SHARING_FEATURES } from './plan-features-sharing';
export type FeatureState = 'included' | 'absent' | 'limited' | 'conditional';
export type FeatureRow = readonly [
  label: string,
  detail: string,
  liberte: string,
  pro: string,
  liberteState: FeatureState,
  proState: FeatureState,
];
export const FEATURE_GROUPS = [
  { title: 'Activités et calendrier', rows: ACTIVITY_FEATURES },
  { title: 'Participants, e-mails et reports', rows: PARTICIPANT_FEATURES },
  { title: 'Paiements et comptabilité', rows: PAYMENT_FEATURES },
  { title: 'Partage, apparence et continuité', rows: SHARING_FEATURES },
] as const;
export const FEATURE_UI = {
  FEATURE: 'Fonctionnalité',
  TEST_NOTE:
    'Version de test : aucun abonnement ni paiement réel. Les e-mails dépendent de la configuration d’envoi et des traitements planifiés ; Stripe doit être raccordé avant une ouverture payante.',
} as const;
