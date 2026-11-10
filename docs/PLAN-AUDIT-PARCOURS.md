# Audit des parcours et du design

## Méthode

Base PostgreSQL locale jetable, comptes fictifs et navigateur Chromium. Aucun paiement réel,
aucun e-mail envoyé, aucune réservation client modifiée. Parcours organisateur et participant,
avec contrôles aux largeurs 320, 390 et 1440 pixels, clavier, retours et données enregistrées.

Les contrôles initiaux passent : 52 tests unitaires et 73 tests SQL. Quatre nouveaux scénarios
échouent avant correction : leurs échecs constituent la reproduction des défauts ci-dessous.

## Corrections dans l’ordre

1. **Enregistrement bloqué silencieusement.** Un lien Instagram invalide puis replié empêche
   l’enregistrement sans révéler le champ. Ouvrir ses sections parentes et focaliser le premier
   champ invalide ; préciser le format HTTPS. Vérifier aussi la correction puis la sauvegarde.
2. **Action de report impossible.** Une réservation annulée avant paiement ayant libéré son
   ancien code propose un nouvel avoir que le serveur refuse. Partager la règle métier entre
   serveur et projection de gestion ; masquer l’action inéligible. Conserver les contrôles
   transactionnels, l’isolation des organisations et l’idempotence des attributions valides.
3. **Information participant mal hiérarchisée.** Le lien direct omet le descriptif ; de longues
   consignes précèdent le titre et le prix. Publier le descriptif, placer les informations après
   l’identité de l’activité et replier les textes longs. Garder l’adresse publique ou son message
   différé visible, sans jamais révéler une adresse réservée au rappel.
4. **Actions mobiles peu identifiables.** Les liens de gestion mesurent 22,5 pixels de haut.
   Les grouper avec des cibles d’au moins 44 pixels, sans ajouter de panneaux. Réserver le
   soulèvement au survol aux cartes réellement cliquables.
5. **Actions de virement trop proches.** La revue visuelle montre les boutons de confirmation
   et de refus collés. Les séparer de 16 pixels et vérifier leur écart dans le parcours réel
   de dépôt et validation d’un justificatif, sans changer les autorisations ni les décisions.

Les formulaires gardent leurs validations serveur. Ces corrections ne changent ni les prix,
ni les règles financières, ni les conditions acceptées. Aucune migration n’est nécessaire.

## Validation

- Rejouer les quatre reproductions et contrôler les captures avant/après.
- Ajouter des cas métier sur les avoirs : impayé, remboursé, anonymisé, code libéré ou consommé.
- Simuler une dernière place devenue indisponible pendant la saisie et vérifier la récupération.
- Rejouer les parcours complets existants : création d’espace et d’activité, réglages, aperçu,
  inscription, conditions, virement et justificatif, annulation, avoir et solde, droits d’accès.
- Vérifier les boutons, les retours et l’absence de débordement sur mobile et ordinateur.
- Exécuter TypeScript, ESLint, tests unitaires, tests SQL, compilation et suite navigateur.

Le rapport final distinguera les défauts corrigés, les parcours vérifiés et les limites :
prestataires de paiement, distribution réelle des e-mails et planification hébergée hors de ce test.
La fusion et le déploiement restent des étapes séparées de cet audit.
