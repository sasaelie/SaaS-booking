# Batterie de tests du service — 9 novembre 2026

## Objectif et périmètre

Vérifier qu’un organisateur peut préparer une activité, partager sa page, recevoir une réservation, contrôler un virement et gérer annulations et données privées. Vérifier chaque frontière : interface → validation → transaction → effet différé → retour utilisateur. Aucune réservation réelle, aucun débit, remboursement réel ou envoi d’e-mail pendant les tests.

## Outils et raisons

| Outil | Vérification | Pourquoi |
|---|---|---|
| TypeScript strict et ESLint | Contrats, couches, erreurs de compilation | Détecter les incompatibilités avant exécution |
| Vitest | Règles et entrées limites | Horaires, signatures, montants, formats, expiration |
| Vitest + PostgreSQL 17 local | Contraintes, verrous et concurrence | Les doubles réservations et transactions ne se prouvent pas avec des mocks |
| Playwright + Chromium | Parcours réels, requêtes, données et rendu | Repérer les actions affichées mais non exécutables, les erreurs silencieuses et les retours manquants |
| GitHub Actions | Reproduction indépendante | Éviter une validation valable seulement sur un poste |
| Traces, captures et rapport JSON | Preuves des échecs et corrections | Rejouer un défaut et garder un bilan exploitable |

Les doublures des prestataires servent uniquement aux scénarios déterministes de panne. Elles ne prouvent pas une connexion Stripe, Mollie ou Resend réelle.

## Ordre d’exécution

1. État de référence : version Git, configuration non sensible, 42 tests unitaires et 47 tests PostgreSQL existants, compilation et 16 parcours navigateur.
2. Scénarios complémentaires ciblés : abandon/annulation avant paiement, justificatif après début de séance, purge des preuves anciennes, liens manquants, réponses non JSON et erreurs de taille, confirmation sans encaissement.
3. Tests en échec avant correction ; distinguer défaut reproduit et simple hypothèse de lecture.
4. Corrections prioritaires, puis mêmes tests et régression complète.
5. Rapport des résultats et plan restant classé par gravité, preuve et dépendance externe.

## Matrice de risques

| Famille | Situations à exercer | Résultat attendu |
|---|---|---|
| Disponibilité | Dernière place demandée simultanément, double clic, reprise réseau | Capacité respectée ; une réservation par clé identique |
| Paiement | Doublon webhook, montant/devise faux, paiement tardif | Pas de double confirmation ; refus ou remboursement différé idempotent |
| Virement | Fausse image, taille excessive, remplacement, validation/refus, panne de suppression | Pas de fichier accepté sans droit ; reprise durable ; aucun encaissement fictif |
| Annulation | Avant/après 72 h, avant paiement, répétition | Place libérée ; code seulement si sa valeur est justifiée ; un seul code |
| Codes | Moins cher, complément, usage externe, réemploi concurrent | Solde correct et usage unique |
| Comptes | Non connecté, compte non vérifié, propriétaire/gestionnaire, autre organisation | Accès strictement autorisé ; aucune mutation par changement d’identifiant |
| Abonnement | Résiliation en période payée, limite exacte, accès offert | Droits jusqu’à échéance ; gestion de l’historique conservée |
| Calendrier | Bruxelles, été/hiver, pauses, séances manuelles | Date locale correcte ; priorité métier respectée |
| Vie privée | Jeton falsifié/périmé, effacement, preuve ancienne, mail après anonymisation | Données protégées ; liens révoqués ; pas de mail aux personnes anonymisées |
| Interface | 320/390/1280 px, clavier, reprise après erreur, retour organisateur | Lecture et navigation utilisables ; message explicite et action réessayable |
| Personnalisation | Logo/photo, trois couleurs, catalogue et séance | Photo confinée ; texte et bouton lisibles ; réglage persistant |
| Exploitation | Relance des jobs, refus de cron non authentifié, panne prestataire | Pas d’accès public au traitement ; travail différé reprenable |

## Garde-fous

- Base jetable `booking_test` sur `127.0.0.1` seulement ; les tests SQL refusent une cible distante.
- Exécuter les tests SQL avant le peuplement du navigateur : ils vident cette base locale.
- Tous les paiements sont désactivés dans la recette navigateur ; identités et fichiers de test synthétiques.
- Les clés et données personnelles n’apparaissent ni dans les rapports ni dans les captures publiées.
- Aucune fusion automatique, aucune mise en production commerciale.

## Conditions de sortie

Les contrôles doivent réussir après correction. Le rapport doit séparer tests locaux, contrôles hébergés et intégrations non raccordées. Un succès automatique n’est ni une certification juridique, ni un test de charge à grande échelle, ni une validation des sauvegardes ou des prestataires réels.

## Commandes reproductibles

Dans une copie isolée sans fichier `.env.local` réel, avec PostgreSQL local jetable disponible :

```bash
export TEST_DATABASE_URL='postgresql://postgres:booking_test_only@127.0.0.1:55432/booking_test'
export DATABASE_URL="$TEST_DATABASE_URL"
npm run db:migrate
npm run verify
npm run test:integration
APP_ENVIRONMENT=staging PAYMENTS_ENABLED=false npm run build
ALLOW_DEMO_SEED=true npm run db:seed
```

Conserver le chemin `/studio-demo/...` imprimé par la dernière commande. Dans un second terminal, démarrer le serveur local (clés factices exclusivement réservées à ces tests) :

```bash
APP_ENVIRONMENT=staging PAYMENTS_ENABLED=false STORAGE_BACKEND=postgres \
DATABASE_URL='postgresql://postgres:booking_test_only@127.0.0.1:55432/booking_test' \
NEXT_PUBLIC_APP_URL=http://127.0.0.1:3004 \
BETTER_AUTH_SECRET=local_auth_test_only_not_for_production_123456 \
SELF_CANCEL_HMAC_SECRET=local_self_test_only_not_for_production_123456 \
npm run start -- --hostname 127.0.0.1 --port 3004
```

Puis, dans le premier terminal :

```bash
STAGING_BROWSER_TEST=true BOOKING_TEST_BASE_URL=http://127.0.0.1:3004 \
BOOKING_TEST_PATH='/studio-demo/remplacer-par-le-chemin-imprime' \
BROWSER_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
npm run test:summary
```

Adapter uniquement le chemin Chromium à son installation ; GitHub Actions installe son propre navigateur. Le workflow reproduit les phases et conserve rapports HTML/JSON, captures et traces d’échec. Ne pas lancer les tests d’intégration pendant les tests navigateur : ils vident la même base locale.

Les artefacts doivent provenir de cette exécution, dans un dossier `qa-results/` propre. La synthèse agrège les trois suites ; elle ne remplace pas l’exécution réussie de TypeScript, ESLint, la migration et la compilation dans le workflow.

Les exécutions focalisées accidentelles (`test.only` / `it.only`) sont interdites par la configuration. La synthèse refuse aussi de valider une suite contenant des tests ignorés ou instables.
