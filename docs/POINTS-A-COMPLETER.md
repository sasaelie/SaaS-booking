# Points à compléter dans les sources reçues

Cette liste sert à reprendre le développement. Ces points n’ont pas été corrigés dans l’archive de classement.

## Assemblage et compatibilité

- Remplacer les cinq injections `{} as any` des routes/actions par des adaptateurs réels.
- Dans la route webhook, `headers()` doit être attendu pour Next.js 15.
- La route importe Stripe et un adaptateur de paiement, contrairement à la règle ESLint fournie.
- Le script `next lint` est incompatible avec l’intention d’utiliser ESLint 9 en configuration plate ; prévoir un appel direct à ESLint et un parseur TypeScript.
- La configuration plate ne configure pas le parseur TypeScript ni toutes les règles Next/React et d’architecture attendues.
- Harmoniser React 19 avec ses types (les types fournis sont en version 18), vérifier la compatibilité Next/React et revoir les versions de dépendances avant utilisation.
- Vérifier la compatibilité du schéma et de ses callbacks avec Drizzle 0.33.
- Le contrat simplifié `StripeSdkClient` n’est pas nécessairement assignable au SDK réel, notamment pour les objets extensibles Stripe.
- Le test du jalon 3 annote une méthode avec `Promise<ReturnType<...>>`, créant un type de promesse imbriqué.
- Ajouter `src/config/env.ts`, le client PostgreSQL, le pilote, les migrations, les adaptateurs manquants et le point de composition serveur.
- Ajouter layout/page, l’import global du CSS et le traitement des classes utilitaires utilisées par le widget.
- Plusieurs fonctions dépassent 40 lignes et certaines constantes métier restent en dur ; les règles AGENTS ne sont pas encore toutes satisfaites.

## Cohérence métier et transactions

- Garantir l’isolation des organisations dans les requêtes et les relations SQL.
- Ajouter des contraintes SQL sur les montants, capacités, statuts et dates ; `$type` ne crée pas de contrainte SQL.
- Traiter les heures locales ambiguës/inexistantes et les fuseaux invalides sans exception échappée.
- Filtrer les données du calendrier par activité et respecter précisément les bornes du calendrier et l’état des séances persistées.
- Donner un résultat idempotent métier aux répétitions de réservation.
- Coupler consommation du voucher, réservation, prix serveur et verrou de paiement dans une même transaction. Le cas d’usage de création ignore actuellement `voucherCode`.
- Vérifier les droits d’annulation, d’administration et d’accès à l’avantage externe. `adminOverride` ne doit pas être accepté d’un client non autorisé.
- Empêcher l’émission multiple de vouchers pour une même annulation et définir le traitement d’un report payé avec un autre report.
- Lier le verrou d’un voucher à une réservation précise pour gérer les paiements tardifs après réutilisation du code.
- Définir l’expiration de trois mois aux fins de mois : `setUTCMonth` peut déborder dans le mois suivant.
- En mode NONE, une confirmation ne prouve pas un paiement ; revoir `amountPaidCents`.

## Paiements, notifications et fichiers

- Brancher réellement la création Checkout après réservation et persister les références sans confondre identifiant Checkout et PaymentIntent.
- Vérifier état payé, montant attendu, devise, organisation et réservation à la réception du webhook ; traiter les moyens de paiement asynchrones si activés.
- `expires_at` est transmis, mais l’adaptateur ne force pas lui-même une durée de 30 minutes ; vérifier les limites Stripe et la latence entre blocage et création Checkout.
- `merchantAccountId` est déclaré mais non utilisé : Stripe Connect n’est pas implémenté.
- Rendre les remboursements persistants, idempotents et reprenables en cas de panne, au-delà de la déduplication d’un événement.
- Les résultats d’envoi d’e-mail sont ignorés ; prévoir un envoi fiable et des reprises.
- Fermer et verrouiller la séance avant les effets externes : le parcours actuel rembourse avant l’annulation SQL et permet des courses ou des effets partiels.
- Persister les obligations de remboursement bancaire ; une liste retournée ne suffit pas à les suivre.
- Contrôler la réservation avant dépôt de preuve et nettoyer le fichier si le rattachement échoue.
- Revalider la disponibilité sous verrou lors d’une approbation bancaire après expiration.
- Les magic bytes identifient un en-tête ; ils ne prouvent pas une image complète et décodable. L’échantillon PNG du test est incomplet.
- La purge du stockage et la décision SQL ne sont pas atomiques ensemble : prévoir une stratégie de reprise.
- L’expression `réglage || true` impose la purge même si le réglage organisation est faux ; clarifier la règle souhaitée.

## CGV, données et interface

- L’empreinte CGV actuelle est un hash 32 bits non cryptographique ; elle ne suffit pas à garantir une preuve opposable. Archiver le texte accepté et définir la preuve d’acceptation.
- Faire valider les CGV, l’applicabilité de l’exception de rétractation et les durées fiscales selon les obligations actuelles de l’organisation. La durée de sept ans est ici une valeur reçue, pas une conclusion juridique vérifiée.
- Éviter les données personnelles et les jetons complets dans les logs.
- Valider la structure du payload HMAC après décodage ; une assertion TypeScript n’est pas une validation.
- Le widget ne fournit pas tous les champs de l’action, ne valide pas le voucher auprès du serveur, n’utilise pas `requirePhone`, affiche des CGV fixes et ignore `currency` dans son formatage.
- Ajouter les labels accessibles et le retour d’erreur utilisateur ; adapter la sélection si la disponibilité change.
- Compléter les scénarios absents et ajouter des tests d’intégration réels PostgreSQL pour la concurrence et l’idempotence.
