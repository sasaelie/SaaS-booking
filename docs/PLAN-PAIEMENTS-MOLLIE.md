# Plan de bataille — paiements, abonnements et mise en service

## Décisions confirmées

- Organisateur : Stripe OU Mollie comme prestataire principal, sans commission de plateforme sur les billets.
- Participant : plusieurs moyens disponibles via ce prestataire, selon pays, compte, activation et compatibilité avec le parcours.
- Virement direct sur l’IBAN de l’organisateur : option indépendante, utilisable sans prestataire connecté.
- Paiement immédiat : place bloquée 30 minutes par défaut. Une réussite confirmée par le prestataire et vérifiée côté serveur confirme la réservation ; le reversement vers la banque n’est pas attendu.
- Un état créé, en attente, autorisé mais non capturé, un mandat ou un retour navigateur ne vaut pas paiement réussi. Les états exacts seront rapprochés selon chaque API.
- Virement direct : blocage 48 heures actuellement, contrôle de réception par l’organisateur. Une capture seule ne confirme pas le paiement.
- Paiement asynchrone via un prestataire : échéance et politique de blocage adaptées au moyen ; le délai de 30 minutes ne s’applique pas aveuglément aux virements. Paiement tardif et capacité recontrôlés sous verrou.
- Abonnements de NOTRE plateforme : Mollie, séparé du prestataire choisi par l’organisateur.
- Mensuel : 19,99 EUR. Annuel : 199,90 EUR en un paiement, soit dix mensualités et 39,98 EUR d’économie par rapport à douze mensualités.
- Résiliation : arrêt du prochain renouvellement, accès complet jusqu’à la fin de la période effectivement payée. Après échéance, gestion de l’existant conservée, nouvelles activités/séances/réservations bloquées.
- L’annuel n’est pas une facturation mensuelle de 16,66 EUR. Le passage de formule prendra effet à la prochaine échéance par défaut ; aucun deuxième abonnement ou prorata ne sera déclenché implicitement.
- Conservation du visuel validé, des limites de code et des frontières hexagonales.

## État de départ

PR 2 fusionnée au commit `7335f5fcfab518d6a31a83253d7fa5cc48d392a1`. Nouvelle branche créée sur ce commit : `feat/payments-mollie-subscriptions`. Cette branche ne sera fusionnée qu’après confirmation de l’utilisateur.

La PR 2, branche `feat/saas-portals`, contient les espaces SaaS et les accès actuels. Contrôles GitHub réussis sur `735aac7e1b3b5f553b3169ba1110691fe24a6c19` : installation, migrations, TypeScript/ESLint, 35 tests unitaires, 41 tests PostgreSQL, compilation et neuf parcours navigateur.
La version existante gère Stripe et le virement direct ; Mollie, le choix simultané des moyens et l’annuel restent à développer.

## Lot 1 — Contrats, données et compatibilité

1. Séparer les notions de prestataire, moyen proposé et canal de règlement ; ne plus confondre STRIPE, BANK_TRANSFER et NONE dans une seule décision.
2. Conserver un prestataire principal actif par organisation, et plusieurs moyens autorisés par activité. Un choix de prestataire ne garantit pas tous les moyens possibles : interroger ses disponibilités.
3. Ajouter migrations progressives, références de comptes/profils et modes test/live, historique de facturation, périodes et formule mensuelle/annuelle.
4. Conserver prestataire, compte, moyen, montant, devise, environnement et références sur chaque réservation. Un changement de connexion ne modifie pas les anciens paiements ni le prestataire des remboursements.
5. Préserver les réservations et abonnements Stripe existants ; aucune migration de client facturé vers Mollie sans vérifier et arrêter correctement le renouvellement précédent.
6. Faire évoluer les ports de paiement, de connexion et d’abonnement. Le portail de facturation Stripe ne doit pas être invoqué comme si Mollie avait la même interface.
7. Tests des entrées, transitions, isolation et migrations avant les adaptateurs.

Critère de sortie : anciennes données lisibles, anciens parcours conservés et contrats neutres, aucun SDK dans le domaine ou l’UI.

## Lot 2 — Connexions organisateur et paiements participants

1. Conserver Stripe Connect Standard et ajouter Mollie Connect avec autorisation de l’organisateur, état OAuth à usage unique et droits limités aux besoins.
2. Stocker les secrets d’accès Mollie chiffrés côté serveur ; gérer renouvellement des jetons, révocation et compte non finalisé. Aucun secret demandé dans le formulaire d’activité.
3. Adapter le moteur de paiement au prestataire mémorisé et afficher uniquement les moyens disponibles/autorisés.
4. Stripe : vérifier la signature, puis les identités et états financiers. Mollie : vérifier selon le mécanisme de webhook choisi et relire la ressource via l’API authentifiée ; ne jamais croire un simple champ paid reçu par POST.
5. Confirmer sur une réussite de paiement reconnue côté serveur, indépendamment du reversement bancaire ; dédupliquer confirmations, e-mails et remboursements.
6. Vérifier réservation, compte connecté, environnement, montant, devise, référence et disponibilité avant confirmation atomique.
7. Router remboursements et reprises vers le prestataire d’origine, y compris après changement de connexion ; traiter les paiements tardifs sans surbooking.
8. Conserver le virement direct comme option séparée avec communication, contrôle bancaire, purge des preuves et délai propre.

Critère de sortie : un organisateur peut connecter Stripe ou Mollie, autoriser plusieurs moyens et recevoir une réservation réellement confirmée ; les anciennes réservations restent gérables.

## Lot 3 — Nos abonnements Mollie mensuels et annuels

1. Première souscription et consentement au renouvellement, mandat compatible avec Mollie puis abonnement mensuel ou tous les douze mois.
2. Facturer 19,99 EUR ou 199,90 EUR, sans double prélèvement lors de la création du mandat et du premier abonnement. Démarrer le prélèvement suivant après la première période payée.
3. Définir les moyens utilisables en récurrent : un moyen disponible pour un billet ne l’est pas nécessairement pour un renouvellement automatique.
4. Historiser chaque paiement et calculer la période couverte uniquement après confirmation vérifiée du paiement ; un abonnement créé ou un mandat valide ne suffit pas à activer les droits.
5. Arrêt/reprise du renouvellement, échecs, relances, fin de période et changement de formule sans doublon. Conserver la gestion de l’existant et les accès offerts.
6. Présenter montant débité, fréquence, prochaine échéance, état et justificatifs depuis la console, sans dépendre d’un portail Stripe pour les abonnements Mollie.
7. Tester chaque renouvellement et les événements doublés ou reçus hors ordre, y compris les remboursements et annulations de paiement impactant les droits.

Critère de sortie : une seule souscription active par organisation, aucune facturation implicite supplémentaire, droits mensuels/annuels et résiliation conformes.

## Lot 4 — Interfaces et tests complets

- Paramètres : connexion au prestataire, état de préparation et environnement de recette visible ; IBAN direct distinct.
- Activité : moyens acceptés, options indisponibles expliquées ; formulaire participant cohérent avec la disponibilité réelle.
- Abonnement : deux cartes mensuel/annuel, annuel en un paiement et économie exacte, résiliation sans perte anticipée de l’accès payé.
- Tests PostgreSQL réels pour capacité, isolation, idempotence, historique et retour d’erreur ; doubles HTTP du SDK/API réservés aux tests.
- Recette prestataires réelle en environnement de test : succès, échec, annulation, expiration, doublons, notification tardive, remboursement, révocation et autre organisation.
- `npm run verify`, intégration SQL, compilation et parcours navigateur. Captures ordinateur/mobile avant validation.

## Lot 5 — Supabase et Vercel, progressivement

Cible proposée : Supabase pour PostgreSQL en région UE ; Vercel pour l’application Next.js et ses routes serveur, avec région de calcul UE choisie et cohérente avec la base. Le choix d’une région ne suffit pas à garantir la résidence de tous les journaux, sauvegardes et services tiers.

1. Créer un environnement de recette avec données fictives avant une production distincte. Les previews et la CI ne doivent jamais réutiliser la base ou les secrets de production.
2. Conserver Drizzle et Better Auth. Supabase ne nécessite pas de remplacer l’authentification existante par Supabase Auth.
3. Garder PostgreSQL accessible par le serveur uniquement ; choisir un schéma non exposé ou désactiver l’exposition Data API inutile, contrôler rôles et permissions. Ne pas ouvrir nos tables aux clés publiques Supabase.
4. Résoudre la connexion AVANT activation : `src/adapters/payments/saas/lock.ts` utilise actuellement un verrou consultatif de session. Le pooler transactionnel Supabase, habituel en serverless, ne garantit pas cette session entre requêtes. Refactorer vers une coordination persistée compatible avec ce pooler, ou utiliser une connexion de session/directe correctement dimensionnée après tests. Ne pas brancher simplement l’URL transactionnelle sur ce code.
5. Limiter les connexions, vérifier TLS et les certificats, appliquer les migrations par une connexion adaptée aux migrations et tester sauvegarde/restauration.
6. Stockage privé : Supabase Storage compatible S3 est une option à valider avec notre adaptateur. Vérifier lecture temporaire, suppression, versions et nettoyage des justificatifs ; aucun bucket de preuves public.
7. Vercel : URL HTTPS de recette stable pour les retours OAuth et les webhooks, secrets séparés Preview/Production, domaine d’e-mail validé et ordonnanceur de la file PostgreSQL. Les prestataires doivent joindre les webhooks de recette, même si le reste de l’application exige une connexion.
8. Publication réelle seulement après recette, validation des paramètres fiscaux/contractuels, vérification des sauvegardes et accord explicite de mise en service.

## Tester les connexions sans encaissement réel

### Stripe côté organisateur

- Compte Stripe plateforme, Connect activé et environnement Sandbox/test. Paramétrer le client OAuth de test, ses clés et l’URL de retour exacte.
- Créer un compte connecté de test ou suivre le parcours OAuth de test ; pour relier un compte existant, utiliser une adresse e-mail différente de celle du compte plateforme selon les instructions Stripe.
- Depuis l’organisation fictive : connecter, vérifier l’état, créer une activité, effectuer un paiement de test, vérifier le bon compte, puis tester refus, annulation, expiration, notification répétée et remboursement.
- Tester compte incomplet/révoqué et refus de le rattacher à une autre organisation.

### Mollie côté organisateur

- Créer le compte Mollie puis enregistrer l’application Connect dans Developers / Your apps avec son URL de retour et ses permissions.
- Connecter une organisation fictive par le vrai parcours d’autorisation. OAuth autorise l’accès au compte ; il ne constitue pas à lui seul un environnement de paiement de test.
- Pour les ressources financières créées via OAuth : passer explicitement `testmode=true` lorsque l’endpoint le prévoit. Une clé API `test_…` sert aux appels par clé ; elle ne teste pas à elle seule toute la connexion multi-organisateurs.
- Utiliser le Checkout de test pour simuler les états et vérifier la réception réelle du webhook. Ne pas tenter de payer en argent réel pour prouver le fonctionnement.
- Tester renouvellement du jeton, révocation, mauvais profil, isolation entre deux organisations et remboursements. Certaines opérations de compte n’ont pas de mode test : vérifier leur portée avant exécution.

### Notre abonnement Mollie

- Utiliser le compte Mollie de la plateforme, indépendant des comptes organisateurs.
- Tester séparément 19,99 EUR mensuel et 199,90 EUR annuel : premier paiement, renouvellement simulé, échec et arrêt du renouvellement avec accès jusqu’à l’échéance.
- Les ressources de paiement récurrent de test peuvent fournir une URL de simulation d’état plutôt qu’un Checkout, conformément à Mollie.

## Ce que le propriétaire peut préparer maintenant

Créer ses comptes Mollie, Stripe, Supabase et Vercel. Dans Mollie, préparer le profil de la plateforme et l’accès développeur / Connect si disponible ; terminer les vérifications requises par le fournisseur. Le compte pour encaisser nos abonnements et l’application pour connecter d’autres organisateurs sont deux usages distincts.
Les domaines et URL de retour seront renseignés quand la recette sera prête. Les secrets seront saisis dans les paramètres sécurisés de l’hébergement, pas dans le chat ni dans GitHub.

## Ordre de livraison et contrôle des branches

Plan → fusion de la PR 2 vérifiée → nouvelle branche `feat/payments-mollie-subscriptions` issue du commit fusionné → lots 1 à 4 → recette Supabase/Vercel → validation utilisateur → fusion de cette nouvelle branche après confirmation.
Ce document prépare l’intégration. Il n’active ni Mollie, ni l’annuel, ni une base ou un hébergement réels. La création de ces services et la mise en production feront l’objet d’étapes séparées.

## Références officielles consultées

- https://docs.stripe.com/connect/testing
- https://docs.mollie.com/docs/authentication-via-oauth
- https://docs.mollie.com/reference/testing
- https://docs.mollie.com/docs/recurring-payments
- https://docs.mollie.com/reference/create-subscription
- https://supabase.com/docs/guides/database/connecting-to-postgres
- https://supabase.com/docs/guides/storage/s3/compatibility
- https://vercel.com/docs/frameworks/full-stack/nextjs
