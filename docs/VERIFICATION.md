# Vérification des corrections

Version : branche `fix/booking-integrity`, 7 novembre 2026. Base de comparaison : commit `9191857` audité précédemment.

## Résultats mesurés

- Installation `npm ci` dans un dossier vide : réussie, sans contournement des peer dependencies.
- `npm run verify` : réussi ; TypeScript strict et ESLint sans erreur, 27 tests unitaires réussis dans sept fichiers.
- `npm run test:integration` : 24 tests réussis dans six fichiers, sur PostgreSQL 17 local isolé, avec plusieurs connexions réelles.
- `npm run build` : réussi avec Next.js 16.4.5, sans clé de production.
- `npm run test:e2e` : parcours Chromium réussi (formulaire → Server Action → PostgreSQL → confirmation) avec un client fictif ; une seule réservation confirmée et montant encaissé nul en mode NONE.
- `npm audit --json` : zéro vulnérabilité signalée dans l’arbre résolu, dépendances de développement incluses, au moment du contrôle.
- Règles automatiques : zéro `any`/`@ts-ignore`, frontières de couches, 200 lignes maximum par fichier TypeScript et 40 par fonction. Les fichiers générés tels que le lockfile suivent leur format standard.

## Scénarios SQL couverts

Dix réservations simultanées pour cinq places ; dix répétitions de la même demande ; changement de contenu sous une même clé ; isolation d’organisation ; CGV obsolètes ; distinction confirmation/encaissement ; événement Stripe répété et identité financière invalide ; remboursement durable après collision ; émission unique d’un report ; réservation moins chère avec report ; rollback si séance pleine ; échange externe ; ancien paiement après réutilisation d’un report ; fermeture avec confirmation ; blocage déjà expiré ; reprise de tâches ; décision bancaire et purge ; respect du réglage de conservation des justificatifs ; revalidation de capacité après expiration ; pause protégée ; effacement réel des coordonnées et protection de la conservation comptable dans la transaction.

## Conditions des contrôles

Les tests utilisent uniquement des données fictives et une base locale jetable `booking_test`. Le décodeur traite de vraies images de test et rejette les fichiers tronqués. Les tests Stripe vérifient une vraie signature HMAC générée par le SDK ; aucun paiement réel n’a été effectué. Les appels de création Checkout sont testés par doubles pour inspecter les paramètres et leur clé d’idempotence.

La suite navigateur n’a pas utilisé de compte Stripe, Resend, stockage ou fournisseur OIDC de production. Les preuves de paiement, la configuration de résidence UE, les politiques privées du bucket, les e-mails réels et les jetons émis par votre fournisseur doivent être contrôlés avec vos comptes avant mise en service.

La politique initiale de conservation de sept ans et les clauses contractuelles ne sont pas certifiées juridiquement. Les sources ne prétendent plus que la présence d’un article de loi ou d’un hash suffit à fournir une telle certification.

## Publication

Les corrections sont livrées dans une branche dédiée et une pull request vers `main`. Aucun service n’est déployé et aucune migration n’est appliquée à une base de production.
