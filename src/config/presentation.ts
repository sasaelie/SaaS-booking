export const UI_MESSAGES = {
  UNAVAILABLE: 'La réservation est temporairement indisponible.',
  FAILURE: 'Impossible de terminer cette opération. Réessayez avec la même demande.',
  SUCCESS: 'Votre place est réservée.',
  FULL: 'Cette séance ne peut plus être réservée.',
  TERMS_CHANGED: 'Les conditions ont changé. Consultez la nouvelle version avant de confirmer.',
  CANCEL_SUCCESS: 'Votre réservation a été annulée.',
  PHONE: 'Téléphone d’urgence du représentant légal',
  NO_PAYMENT: 'Aucun paiement en ligne ; cette confirmation ne vaut pas reçu de paiement.',
} as const;

export const FORM_LABELS = {
  FIRST_NAME: 'Prénom',
  LAST_NAME: 'Nom',
  EMAIL: 'Adresse e-mail',
  PHONE: 'Téléphone',
  VOUCHER: 'Code de report',
  MARKETING: 'Je souhaite recevoir les actualités (facultatif).',
  TERMS: 'J’ai lu et j’accepte les conditions ci-dessus.',
  BOOK: 'Réserver une place',
  SUBMITTING: 'Réservation en cours…',
  SLOTS: 'Séances disponibles',
  NO_SLOTS: 'Aucune séance disponible pour le moment.',
  SELECT: 'Choisissez une séance',
  MANAGE: 'Gérer ma réservation',
  CANCEL: 'Annuler ma réservation',
  UPLOAD: 'Envoyer le justificatif',
  PROOF: 'Justificatif de virement',
  DONE: 'Votre demande a été enregistrée.',
  CONFIRM_CANCEL: 'Confirmer l’annulation de cette réservation',
  BACK_ACTIVITY: 'Retour à l’activité',
  BACK_HOME: 'Retour à l’accueil',
  PROOF_HINT:
    'Image PNG, JPEG ou WebP, 4 Mo maximum. Visible uniquement par l’organisateur autorisé.',
  PROOF_RECEIVED:
    'Votre justificatif a été reçu. L’organisateur peut le consulter dans votre fiche et vérifier le virement.',
  PROOF_INVALID: 'Choisissez une image PNG, JPEG ou WebP valide, de 4 Mo maximum.',
  CONTEXT_UNAVAILABLE:
    'Impossible de charger votre réservation pour le moment. Vérifiez votre connexion puis réessayez.',
  RETRY: 'Réessayer',
  LINK_INVALID:
    'Ce lien de réservation est invalide ou expiré. Utilisez le lien le plus récent de votre réservation.',
  STORAGE_UNAVAILABLE:
    'Le dépôt du justificatif est momentanément indisponible. Votre réservation reste enregistrée.',
  CHOOSE_IMAGE: 'Choisir une image',
  NO_IMAGE: 'Aucune image sélectionnée',
  CANCEL_HEADING: 'Annuler cette réservation',
  TERMS_TITLE: 'Consignes de participation et droit au remboursement',
} as const;
