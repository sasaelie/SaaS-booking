import { sha256 } from '../../lib/sha256';
import { ok, type Result } from '../../lib/result';
// src/core/domain/terms-generator.ts
import {
  AUDIENCE_POLICIES,
  PAYMENT_RULES,
  MONEY,
  type AudiencePolicy,
  type PaymentMode,
} from '../../config/constants';
export interface TermsGenerationContext {
  readonly organizationName: string;
  readonly activityName: string;
  readonly priceCents: number;
  readonly currency: string;
  readonly audiencePolicy: AudiencePolicy;
  readonly paymentMode: PaymentMode;
  readonly noticeHoursForVoucher: number;
  readonly voucherValidityMonths: number;
  readonly allowExternalBenefitExchange: boolean;
}
export interface GeneratedTermsDocument {
  readonly clauses: readonly string[];
  readonly fullText: string;
  readonly ageAttestationLabel: string;
  readonly versionHash: string;
}
function formatPriceEuros(priceCents: number, currency: string): string {
  const amount = (priceCents / MONEY.CENTS_PER_UNIT)
    .toFixed(MONEY.DECIMAL_PLACES)
    .replace('.', ',');
  return `${amount} ${currency}`;
}
function buildAudienceClause(policy: AudiencePolicy): {
  readonly clause: string;
  readonly checkboxLabel: string;
} {
  if (policy === AUDIENCE_POLICIES.MINORS_ONLY) {
    return {
      clause:
        'PUBLIC MINEUR EXCLUSIVEMENT : Cette activité est réservée aux mineurs. La réservation doit impérativement être effectuée par un représentant légal majeur qui fournit un numéro de téléphone d’urgence joignable pendant toute la séance.',
      checkboxLabel:
        'Je certifie être majeur(e), agir en qualité de représentant légal de l’enfant inscrit et fournir un numéro d’urgence valide.',
    };
  }
  if (policy === AUDIENCE_POLICIES.ADULTS_ONLY) {
    return {
      clause:
        'PUBLIC MAJEUR UNIQUEMENT : Cette activité est strictement réservée aux participants majeurs (18 ans accomplis le jour de la séance).',
      checkboxLabel:
        'Je certifie sur l’honneur être majeur(e) (18 ans ou plus) à la date de la séance.',
    };
  }
  return {
    clause:
      'PUBLIC TOUT PUBLIC : Toute réservation effectuée pour un participant mineur doit être validée par son représentant légal majeur.',
    checkboxLabel:
      'Je certifie être majeur(e) et, si la place concerne un mineur, agir en qualité de représentant légal autorisé.',
  };
}
export async function generateDynamicTerms(
  ctx: TermsGenerationContext,
): Promise<Result<GeneratedTermsDocument>> {
  const formattedPrice = formatPriceEuros(ctx.priceCents, ctx.currency);
  const audienceInfo = buildAudienceClause(ctx.audiencePolicy);
  const externalBenefitText = ctx.allowExternalBenefitExchange
    ? ' ou échangeable contre l’avantage alternatif proposé par l’organisateur (ex. accès cours en ligne)'
    : '';
  const clauses: string[] = [
    `1. ORGANISATEUR & PRESTATION : Réservation d’une (1) place individuelle pour l’activité « ${ctx.activityName} » organisée par ${ctx.organizationName}, au tarif unitaire de référence de ${formattedPrice}.`,
    `2. ${audienceInfo.clause}`,
    `3. ANNULATION PAR LE PARTICIPANT & CODE DE REPORT : Aucun remboursement en argent n’est effectué en cas d’annulation par le participant ou d’absence. Si le participant notifie son annulation au moins ${ctx.noticeHoursForVoucher} heures avant le début de la séance, un Code de report unique de la valeur éligible de sa réservation (paiement reçu et valeur de report effectivement appliquée) (valable ${ctx.voucherValidityMonths} mois sur une prochaine séance${externalBenefitText}) lui est transmis.`,
    `4. ANNULATION PAR L’ORGANISATEUR : En cas d’annulation de la séance par ${ctx.organizationName}, le participant est intégralement remboursé de la somme versée dans un délai maximal de ${PAYMENT_RULES.ORGANIZER_REFUND_DEADLINE_DAYS} jours.`,
    `5. ABSENCE DE DROIT DE RÉTRACTATION (DROIT BELGE) : Conformément à l’article VI.53, 12° du Code de droit économique belge, le consommateur ne dispose pas du droit de rétractation de 14 jours pour les prestations de services d’activités de loisirs fournies à une date ou selon une période d’exécution déterminée.`,
  ];
  clauses.push(
    `6. PAIEMENT : Mode ${ctx.paymentMode}. Une confirmation sans paiement en ligne ne constitue pas une preuve d’encaissement. Seules les sommes effectivement versées sont remboursables en argent ; la valeur d’un report est traitée séparément.`,
  );
  const fullText = clauses.join('\n\n');
  const hash = await sha256(fullText);
  if (!hash.ok) return hash;
  return ok({
    clauses,
    fullText,
    ageAttestationLabel: audienceInfo.checkboxLabel,
    versionHash: hash.value,
  });
}
