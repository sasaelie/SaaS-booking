# Rapport de tests du service — 9 novembre 2026

## Conclusion

Le moteur et les interfaces ont été testés localement avec de vraies transactions PostgreSQL et un navigateur Chromium. Plusieurs parcours d’exception présentaient des défauts malgré les contrôles précédemment réussis. Les défauts confirmés sont corrigés et protégés par des tests de régression. Cela ne constitue pas une validation des prestataires réels ni une autorisation de lancement commercial.

Plan initial : [PLAN-TESTS-SERVICE.md](PLAN-TESTS-SERVICE.md). Suite et corrections réalisées à partir de `8ad03d3`, sur `test/service-regression-audit`.

## Méthode et preuves

- Référence réexécutée avant correction : 42 tests unitaires et 47 tests PostgreSQL réussis. Seize parcours navigateur existaient déjà.
- Première reproduction complémentaire : 4 tests PostgreSQL en échec (deux états d’annulation, dépôt après début, purge d’une preuve ancienne).
- Première reproduction navigateur : 3 scénarios en échec (lien absent, annulation impayée, refus HTTP 413 non JSON). Une panne réseau de chargement a ensuite été reproduite séparément.
- Les journaux UNAUTHORIZED/CONFLICT attendus des scénarios négatifs ne sont pas des échecs de suite.
- Les nouveaux tests ont été écrits avant les corrections correspondantes. Les traces d’échec ont servi à distinguer erreurs produit et sélecteurs de test.
- Deux sélecteurs navigateur ont été précisés : l’annonceur Next.js porte lui aussi le rôle `alert`. Cette correction du banc de test ne représente pas un défaut produit supplémentaire.
- Base locale jetable `booking_test`, pool de trois connexions, PostgreSQL 17 ; identités et fichiers synthétiques. Aucune écriture sur Supabase hébergé, aucun paiement ou e-mail réel pendant la batterie.

## Résultat final

| Contrôle | Résultat |
|---|---|
| TypeScript strict et ESLint | Réussis |
| Vitest unitaire | 48 tests réussis |
| Vitest avec PostgreSQL réel local | 55 tests réussis |
| Compilation Next.js en recette | Réussie |
| Playwright/Chromium | 22 parcours réussis, sans test ignoré ou instable |
| Rapports et synthèse | JSON, rapport HTML et synthèse Markdown générés ; incomplet = échec |

Soit **125 cas automatisés**. Ils n’ont pas tous la même portée : les tests unitaires ne remplacent pas les parcours complets. Les résultats détaillés sont produits dans `qa-results/` et les traces/captures dans `test-results/` ; ces répertoires sont exclus de Git et conservés comme artefacts de CI.

## Défauts et corrections

| Réf. | Gravité de service | Constat et preuve | Correction et validation |
|---|---|---|---|
| F01 | Haute | L’écran proposait d’annuler une réservation impayée, mais le repository refusait tout statut autre que confirmé. Tests SQL et navigateur en échec. | Annulation des attentes de paiement et preuves soumises avant séance ; place libérée ; reprise idempotente ; crédit verrouillé libéré sans nouveau code. |
| F02 | Moyenne | Un justificatif pouvait être déposé après début de séance, malgré sa disparition de l’interface, tant que le verrou de 48 h subsistait. Test SQL en échec. | Vérification de la date dans les deux transactions serveur, avant stockage et avant rattachement. La validation administrative tardive reste distincte. |
| F03 | Haute | La purge des impayés anciens omettait le statut PROOF_SUBMITTED. Test SQL en échec. | Ce statut est inclus ; coordonnées anonymisées et purge du fichier programmée. Les tests de conservation comptable restent réussis. |
| F04 | Moyenne | Sans jeton, la gestion affichait un écran sans explication ; un changement du fragment pouvait conserver l’ancien contexte. Test navigateur en échec. | Message explicite, écoute du changement de jeton, abandon des anciennes requêtes et effacement du contexte précédent. |
| F05 | Moyenne | Une réponse HTML/texte de refus d’import produisait un message générique ; un corps JSON signalant un échec pouvait être considéré comme un succès si le statut HTTP était 200. Tests navigateur et unitaire. | Interprétation du statut 413 et du corps JSON ; un succès nécessite `success: true` ; le bouton reste réessayable. |
| F06 | Moyenne | Une panne réseau sur un lien valide était présentée comme un lien expiré, sans reprise proposée. Reproduction navigateur séparée. | Erreur temporaire distincte, bouton Réessayer ; les erreurs de configuration/serveur ne deviennent plus automatiquement UNAUTHORIZED. |
| F07 | Moyenne | Le message d’annulation pouvait coexister avec l’ancien statut affiché. Lecture du flux puis vérification de régression. | Rechargement du contexte après mutation ; statut annulé visible et confirmé après actualisation. |

Mesure préventive supplémentaire : import limité à **4 MiB** au lieu de 5 MiB. La [limite documentée des Functions Vercel](https://vercel.com/docs/functions/limitations#request-body-size) est de 4,5 MB, enveloppe multipart comprise. Les limites client/serveur et les libellés sont alignés ; les images déjà stockées restent lisibles. Le seuil exact et le dépassement d’un octet sont testés avec une signature PNG valide. Une erreur 413 est aussi exercée par injection de panne, sans envoyer un gros fichier à Vercel.

## Concurrence et sécurité exercées

- Cinquante tentatives simultanées sur la dernière place : **1 confirmation, 49 refus SESSION_FULL**, une réservation et une séance en base ; rafale SQL observée en 722 ms dans cette exécution locale. Ce temps n’est ni une latence HTTP, ni un objectif de production.
- Trente appels simultanés au limiteur : vingt acceptés ; nouvelle fenêtre utilisable.
- Deux travailleurs de jobs : huit tâches différentes traitées sans duplication dans cette exécution. Une panne après un effet externe n’est pas une garantie d’exécution exactement une fois ; les clés d’idempotence restent nécessaires.
- Doublons de paiement, mauvais montant/devise, collision tardive et demande de remboursement persistée : tests existants conservés et réussis avec prestataire doublé.
- Isolation propriétaire/gestionnaire/autre organisation, cookies, origine des mutations et jetons falsifiés/expirés : contrôles SQL, unitaires et navigateur.
- Faux PNG contenant un PDF : rejet par l’API réelle, état de réservation inchangé.
- Point d’entrée des tâches différées sans authentification : refus. En local sans CRON_SECRET, ce refus est un 503 ; cela ne valide pas l’exécution d’un cron autorisé hébergé.
- Photo, catalogue, couleurs, QR, intégration externe, clavier et tailles 320/390/1440 px selon les scénarios : régression existante conservée.

## Plan de correction décidé après reproduction

1. **Débloquer l’annulation sans paiement**, avant d’ajouter d’autres écrans : éviter une place immobilisée et préserver la valeur des codes. Réalisé.
2. **Fermer les écarts serveur/interface** sur les dépôts tardifs et la rétention des preuves. Réalisé.
3. **Rendre les pannes compréhensibles et réessayables**, sans confondre réservation, paiement et lien invalide. Réalisé.
4. **Aligner l’import sur l’hébergement** et maintenir les fichiers existants. Réalisé.
5. **Industrialiser les preuves** : rapports JSON/HTML, synthèse stricte, artefacts GitHub Actions. Réalisé.

## Plan restant avant exploitation réelle

| Priorité | Action | Preuve de sortie attendue |
|---|---|---|
| Avant encaissement | Raccorder Stripe/Mollie de test avec comptes organisateurs, puis abonnements mensuel/annuel | Paiement officiel de test, webhook, abandon, remboursement et résiliation constatés côté prestataire et application |
| Avant ouverture aux participants | Domaine e-mail vérifié et chaîne des notifications | Inscription, récupération, confirmation et code de report livrés réellement à plusieurs destinataires autorisés |
| Avant exploitation continue | Ordonnanceur authentifié et suivi des erreurs/outbox | Déclenchement hébergé, reprise après panne et alerte sur tâche différée en échec |
| Avant conservation de données réelles | Stockage privé de production, sauvegardes et restauration | Lecture privée, suppression/versions, restauration d’une copie de base et procédure documentée |
| Avant volume important | Charge sur une infrastructure isolée comparable à la production | Mesures HTTP, taux d’erreur, latences p95 et saturation des connexions selon le volume visé |
| Avant contractualisation | Revue juridique CGV, RGPD et durées comptables | Validation des règles applicables par un professionnel ; aucun test technique ne la remplace |

Mollie, les parcours annuels non raccordés, la délivrabilité, les sauvegardes et la supervision sont des dépendances restantes, pas des fonctions validées par les doubles de test. La règle comptable actuellement codée utilise une échéance au 1er janvier après la période d’archive configurée, et non un simple anniversaire `createdAt + 7 ans` ; elle doit être validée pour le statut de l’organisation. Elle n’a pas été modifiée par cet audit.

## Reproduction et lecture

Suivre les commandes et garde-fous de [PLAN-TESTS-SERVICE.md](PLAN-TESTS-SERVICE.md). `npm run test:summary` produit `qa-results/summary.md` et `summary.json` après les trois suites. Un rapport manquant, un échec, un test ignoré ou instable rend la synthèse non valide. La synthèse décrit les tests, pas une certification de déploiement ou de disponibilité des services réels.

Les nouveaux fichiers de régression sont `tests/unit/service-boundaries.test.ts`, `tests/integration/service-failures.test.ts`, `tests/integration/service-concurrency.test.ts` et `tests/e2e/service-recovery.spec.ts`.
