# Séances, notifications et présentation

## Demandes retenues

1. Depuis « Prochaines séances », ouvrir une fiche avec le cours, les horaires et le fuseau,
   le lieu, les consignes, les places et les inscrits de cette séance uniquement. Prévoir un retour.
   Les séances récurrentes sans réservation doivent fonctionner avant la création d’un identifiant SQL.
2. Remplacer « Mes organisations » par « Mes espaces » dans le titre et la navigation.
3. Voyants lumineux fixes avec halo discret : vert pour actif/payé/accepté ; orange pour attente
   de paiement, activation ou vérification ; rouge pour annulation, refus et expiration.
   Garder les libellés lisibles et distinguer une action proposée d’un état déjà acquis.
4. Après confirmation d’annulation, notifier chaque inscrit avec le motif, le cours et les horaires.
   Le motif est déjà conservé dans la file, mais manquait au message. Déclencher immédiatement
   le traitement des seules notifications concernées, après validation de la transaction.
   Ne pas déclencher les anciens messages ou les remboursements pendant cette opération.
5. Réorganiser le bas de l’éditeur d’apparence : actions alignées, espacements réguliers,
   message d’enregistrement distinct, aperçu participant clairement accessible. Réutiliser
   ces règles dans les groupes d’actions comparables sans ajouter de panneaux inutiles.
6. Mettre en valeur le titre des cours dans les cartes publiques : police éditoriale cohérente,
   hiérarchie titre/descriptif/prix/action, alignement et contraste sur les images importées.

## Ordre de réalisation

- Valider les requêtes de séance, définir le contrat privé et les cas de test métier.
- Implémenter la lecture autorisée d’une séance calculée ou enregistrée, avec ses seuls inscrits.
- Corriger le contenu et l’envoi ciblé des notifications, avec déduplication et reprise persistée.
- Appliquer les libellés, voyants et styles communs, puis vérifier les cartes et réglages à l’écran.
- Exécuter TypeScript, ESLint, tests unitaires et SQL, compilation et parcours Chromium.

## Cas à vérifier

- Une séance vide récurrente, une séance avec inscrits, deux séances du même cours, une séance
  annulée et les tentatives d’accès depuis un autre espace ; pagination sans mélanger les dates.
- Annulation non confirmée, confirmation répétée, motif avec sauts de ligne, plusieurs destinataires,
  panne du transport, reprise et concurrence des travailleurs ; aucun courriel avant confirmation.
- Vert/orange/rouge cohérents dans les vues administrateur et organisateur ; paiement reçu
  restant vert, annulation rouge, compte en attente orange ; voyants non clignotants.
- Réglages, cartes longues avec et sans photo, navigation clavier et retours à 320/390/1440 px.

Les tests utilisent exclusivement des comptes et une base locale fictifs, avec transport e-mail
simulé. Aucun envoi réel, aucune migration hébergée ni aucun déploiement pendant cette réalisation.
La livraison réelle dépend toujours du domaine/expéditeur Resend et des restrictions du compte.
