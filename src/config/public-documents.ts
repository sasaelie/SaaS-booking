export const PUBLIC_DOCUMENT_UI = {
  BACK: 'Retour à l’accueil',
  INCOMPLETE:
    'Préversion : l’identité de l’éditeur, ses coordonnées professionnelles et les informations de facturation doivent être finalisées avant l’ouverture commerciale. Aucun paiement réel n’est disponible en test.',
  IDENTITY_TITLE: 'L’éditeur du service',
  LEGAL_NAME: 'Nom ou raison sociale',
  ADDRESS: 'Adresse professionnelle',
  BUSINESS_NUMBER: 'Numéro d’entreprise',
  TAX_STATUS: 'Régime de TVA',
  VAT_NUMBER: 'Numéro de TVA (si applicable)',
  TO_COMPLETE: 'À compléter',
  EMAIL: 'Adresse e-mail',
  PHONE: 'Téléphone',
  IDENTITY_PENDING:
    'Les coordonnées professionnelles de l’éditeur seront publiées ici avant l’ouverture du service au public. Cette page de préversion ne constitue pas une identification légale complète.',
  CONTACT_TITLE: 'Parlons de votre activité.',
  CONTACT_DESCRIPTION:
    'Une question sur les offres, votre espace ou une réservation ? Voici comment trouver le bon interlocuteur.',
  CONTACT_DIRECT: 'Contacter l’équipe',
  CONTACT_PENDING:
    'Le contact professionnel de l’équipe sera disponible ici avant l’ouverture commerciale. Aucun formulaire ne simule un envoi de message.',
  CONTACT_PARTICIPANT: 'Vous avez déjà réservé une séance ?',
  CONTACT_PARTICIPANT_TEXT:
    'Pour un horaire, une consigne, un report ou un remboursement, contactez l’organisateur depuis sa page de réservation ou utilisez votre lien personnel reçu avec votre confirmation. Chaque organisateur gère ses propres activités.',
  CONTACT_ORGANIZER: 'Vous découvrez le service ?',
  CONTACT_ORGANIZER_TEXT:
    'Vous pouvez consulter les réponses aux questions fréquentes, comparer les fonctionnalités ou créer votre espace en Liberté sans carte bancaire.',
  CONTACT_FAQ: 'Lire les questions fréquentes',
  CONTACT_PRICING: 'Comparer les offres',
} as const;
export const PUBLIC_DOCUMENTS = {
  legal: {
    title: 'Mentions légales',
    description:
      'Identité de l’éditeur, hébergement et informations relatives à ce service de réservation en ligne.',
    sections: [
      {
        title: 'Objet du service',
        text: 'La plateforme fournit un outil de création d’activités, de réservation et de suivi pour les organisateurs. L’organisateur identifié sur chaque page publique reste responsable de la séance qu’il propose, de ses consignes et de l’exécution de l’activité.',
      },
      {
        title: 'Hébergement',
        text: 'L’interface et le service web sont hébergés sur Vercel, Inc. Les informations relatives au traitement et à la conservation des données figurent sur la page Confidentialité. Les modalités contractuelles et la localisation des traitements doivent être finalisées avant l’ouverture commerciale.',
      },
      {
        title: 'Contenus et propriété intellectuelle',
        text: 'Les organisateurs conservent leurs droits sur leurs textes, images, logos et activités. Ils doivent disposer des autorisations nécessaires pour les publier. Les éléments propres au logiciel et à sa présentation restent protégés par les droits applicables.',
      },
      {
        title: 'Liens et informations',
        text: 'Les liens vers les réseaux sociaux ou sites d’un organisateur conduisent à des services externes, régis par leurs propres conditions. Les prix et disponibilités des activités sont définis par chaque organisateur.',
      },
    ],
  },
  privacy: {
    title: 'Confidentialité',
    description:
      'Comprendre quelles informations sont nécessaires aux comptes et réservations, à quoi elles servent et comment exercer vos droits.',
    sections: [
      {
        title: 'Qui utilise vos données ?',
        text: 'L’éditeur gère les données nécessaires au compte organisateur, à la sécurité et à la facturation du logiciel. Pour une inscription à une activité, l’organisateur détermine les informations demandées et les finalités liées à sa séance. Les responsabilités et engagements de sous-traitance doivent être précisés contractuellement avant l’ouverture commerciale.',
      },
      {
        title: 'Informations nécessaires',
        text: 'Le compte utilise notamment votre nom et votre adresse e-mail. Une réservation utilise les coordonnées du participant, la séance choisie, les consentements requis, les références de paiement et, si nécessaire, un justificatif de virement. Ne communiquez pas de donnée sensible ou de détail bancaire sans lien avec la réservation.',
      },
      {
        title: 'Pourquoi ces informations ?',
        text: 'Les données servent à créer et gérer le compte, réserver la place, communiquer les informations pratiques, traiter paiements, annulations, reports et demandes de support. Selon la finalité, les bases applicables sont l’exécution du contrat, les obligations légales, la sécurité et, pour les actualités facultatives, un consentement distinct.',
      },
      {
        title: 'Destinataires et séparation des espaces',
        text: 'Un organisateur accède aux données de sa propre organisation. Les prestataires nécessaires à l’hébergement, à l’envoi des messages ou au paiement interviennent selon les services activés. Stripe traite les paiements en ligne lorsque cette connexion est active. Les prestataires, garanties de transfert et contrats de traitement seront précisés avant l’ouverture commerciale ; aucune localisation exclusivement européenne n’est promise ici.',
      },
      {
        title: 'Durées de conservation',
        text: 'La règle prévue pour les coordonnées opérationnelles et justificatifs non fiscaux est une suppression ou anonymisation après 30 jours, une fois la séance terminée et les remboursements, litiges et codes de report soldés. Les pièces comptables suivent une conservation distincte de 10 ans lorsque la loi l’exige. La préversion vérifie le processus de purge avant son activation effective.',
      },
      {
        title: 'Cookies et stockage nécessaires',
        text: 'Le service utilise des cookies de session pour la connexion et un stockage de navigation pour les retours et confirmations de déconnexion. Cette page n’installe pas de suivi publicitaire ni d’outil de mesure d’audience. Tout ajout ultérieur de traceurs non nécessaires devra être expliqué et soumis au choix approprié.',
      },
      {
        title: 'Vos droits',
        text: 'Selon les conditions du RGPD, vous pouvez demander accès, rectification, effacement, limitation, opposition ou portabilité de vos données. Pour une réservation, adressez-vous d’abord à l’organisateur ; pour votre compte ou le service, utilisez le contact de l’éditeur. Un retrait de consentement aux actualités n’annule pas votre réservation. Vous pouvez également saisir l’Autorité de protection des données belge.',
      },
      {
        title: 'Sécurité et liens personnels',
        text: 'Les accès aux espaces sont contrôlés et les liens personnels sont limités aux réservations qu’ils désignent. Ne partagez ni votre mot de passe ni votre lien personnel d’annulation. Les données d’une organisation ne sont pas accessibles à une autre organisation.',
      },
    ],
  },
  terms: {
    title: 'Conditions d’utilisation',
    description:
      'Les règles essentielles pour utiliser le logiciel, choisir une formule et gérer vos activités et réservations.',
    sections: [
      {
        title: 'Compte et usage du service',
        text: 'L’organisateur fournit des informations exactes, protège son accès et publie uniquement des contenus et activités qu’il est autorisé à proposer. Il définit les prix, les places, les horaires, les coordonnées et les consignes nécessaires. Les participants n’ont pas à créer de compte pour réserver.',
      },
      {
        title: 'Formule Liberté',
        text: 'Liberté ne comporte pas d’abonnement. Deux activités peuvent accepter simultanément de nouvelles réservations, avec des séances illimitées. Les réservations payées supportent 3,5 % + 0,45 € de frais, sans plafond, déduits du prix affiché. Les réservations gratuites ne supportent pas de commission. La signature de la plateforme reste visible.',
      },
      {
        title: 'Formule Studio Pro',
        text: 'Studio Pro coûte 29 € par mois ou 260 € payés une fois par an, par espace organisateur. La commission de plateforme est nulle ; les frais bancaires Stripe réels demeurent dus sur les paiements en ligne. Pro donne accès aux activités illimitées, virements structurés, intégration sur un site, QR pour affiches, retrait de la signature et export comptable. Le régime de TVA de l’éditeur doit être précisé avant la commercialisation.',
      },
      {
        title: 'Souscription et fin d’abonnement',
        text: 'Le choix d’une carte tarifaire ne déclenche pas de paiement. Un abonnement est confirmé sur la page de paiement sécurisée, après présentation de son montant et de sa périodicité. Le renouvellement peut être résilié pour la fin de la période payée. Au retour à Liberté, l’historique et les opérations déjà engagées restent accessibles ; les restrictions concernent les nouvelles inscriptions.',
      },
      {
        title: 'Prix et paiements des activités',
        text: 'Le participant paie le prix public affiché pour sa place. Un virement ou une réservation avec règlement auprès de l’organisateur ne constitue pas, à lui seul, une preuve de paiement. Les frais exceptionnels, notamment litiges, conversion de devise ou cartes particulières, suivent les conditions du prestataire et les modalités contractuelles à finaliser avant activation des paiements.',
      },
      {
        title: 'Annulation, report et remboursement',
        text: 'Les consignes et conditions de l’organisateur sont présentées avant la réservation et leur version acceptée est conservée. Un code de report est utilisable uniquement dans l’organisation qui l’a émis et selon ses conditions de validité. Un report n’est pas un remboursement automatique. Les droits légaux impératifs restent applicables, notamment selon la nature et la date de la prestation.',
      },
      {
        title: 'Responsabilités',
        text: 'L’éditeur fournit le logiciel ; l’organisateur assure la prestation réservée et répond aux demandes de ses participants. L’organisateur vérifie les paiements par virement et ses obligations comptables. Le service ne remplace ni un professionnel du droit ni un comptable.',
      },
      {
        title: 'Version de test',
        text: 'Aucun abonnement ni paiement réel n’est prélevé dans l’environnement de test. Les simulations organisateur sont identifiées TEST et séparées des vraies places, transactions et notifications. Les conditions commerciales définitives, l’identité du cocontractant et les modalités de règlement des différends doivent être complétées avant toute ouverture payante.',
      },
    ],
  },
  accessibility: {
    title: 'Accessibilité',
    description:
      'Une interface lisible, utilisable au clavier et adaptée aux différentes tailles d’écran et préférences de mouvement.',
    sections: [
      {
        title: 'Notre objectif',
        text: 'Nous visons une utilisation accessible du service, en nous appuyant sur les recommandations WCAG 2.2 de niveau AA. Cette page décrit les choix de conception et ne constitue pas une certification ni une déclaration de conformité complète de l’application.',
      },
      {
        title: 'Navigation et lecture',
        text: 'La page d’accueil propose une structure de titres, des liens nommés, un accès direct au contenu, des zones de navigation identifiées et un focus visible. Les interactions essentielles sont utilisables au clavier et les informations ne dépendent pas uniquement de la couleur.',
      },
      {
        title: 'Écrans et mouvement',
        text: 'Le contenu s’adapte aux petits écrans et au zoom. Aucun défilement imposé ni animation indispensable n’empêche de lire la page. La préférence de réduction des animations du système est respectée.',
      },
      {
        title: 'Amélioration et signalement',
        text: 'Les vérifications automatiques et manuelles sont complémentaires. Si vous rencontrez un obstacle, indiquez à l’équipe la page concernée, l’action souhaitée et, si utile, le navigateur ou la technologie d’assistance utilisée. Les coordonnées de contact de l’éditeur figurent sur la page Contact dès leur publication.',
      },
    ],
  },
} as const;
