# Intégration fiable — suivi de réalisation

Branche : `feat/resilient-embed`, depuis `main` (`5158e82`).

1. [x] Diagnostic du parcours et des protections existantes.
   Réservation sans compte, gestion intégrée par accès propre au billet et paiement ouvert hors iframe déjà présents.
   Manques : confirmation explicite de disponibilité, attente et reprise sur le site, vérification guidée dans Partager, tests avec cookies et stockage refusés.
2. [x] Prouver le parcours sans cookies tiers et préciser la transition vers le paiement sécurisé.
   Réserver, enregistrer le PDF, gérer et annuler avec cookies et stockage refusés passent sur Chromium et WebKit.
   Le paiement simulé reste en attente à la fermeture de sa fenêtre, réutilise le même lien à la reprise et confirme uniquement après réponse serveur.
3. [x] Ajouter le protocole de disponibilité, les états de chargement et de reprise, et la vérification d’installation.
   Script refusé, iframe refusée par la politique du site, absence de réponse, reprise et indisponibilité serveur sont couverts.
4. [x] Exécuter les contrôles de code, les tests navigateur, la vérification visuelle et documenter les limites.

## Périmètre

- Conserver les parcours et le design validés, les liens autonomes, les modes intégré et flottant.
- Le contrôle initial ne recharge pas automatiquement une réservation déjà commencée.
- Les messages entre cadre et site ne contiennent aucun code de billet ni donnée participant ; origine et fenêtre émettrice sont contrôlées.
- Le nouveau code copié depuis Partager comporte un accès indépendant du script, utile si le script est lui-même bloqué.
- Vérifier séparément l’accès au calendrier et le fonctionnement sur la page de l’organisateur : aucun résultat ne doit annoncer une installation distante vérifiée à partir du seul aperçu.
- Le test sur le site utilise une nouvelle fenêtre sans accès au compte organisateur, et n’enregistre aucune adresse de site en base.
- Les paiements réels et l’ouverture commerciale restent dans le plan de finition. La page de paiement ne sera pas enfermée dans notre iframe.
- Les moteurs automatisés Chromium, Firefox et WebKit seront vérifiés selon les capacités de l’environnement. Ils ne remplacent pas une validation physique sur Safari/iPhone, Mi et les navigateurs des réseaux sociaux.

Les comptes rendus de progression doivent nommer l’étape en cours et les vérifications effectivement terminées.

## Reproduire les contrôles

Utiliser une base `booking_test` locale isolée, migrée et configurée selon les instructions du dépôt. Les scénarios navigateur créent des comptes et réservations synthétiques ; ils ne doivent pas être dirigés vers une base réelle. Exécuter les tests d’intégration avant les tests navigateur, car ils réinitialisent les données locales.

```sh
npm run verify
npm run test:integration
npm run build
npm run check:runtime-traces
npx playwright install --with-deps chromium firefox webkit
npm run test:e2e
npx playwright test --config playwright.embed.config.ts --project firefox --project webkit
```

Le serveur local, `BOOKING_TEST_BASE_URL`, `NEXT_PUBLIC_APP_URL` et le scénario initial `BOOKING_TEST_PATH` doivent être préparés comme dans le workflow `Verify`. En CI, chaque commande Playwright démarre et arrête son propre serveur. Les nouvelles vérifications Firefox et WebKit sont exécutées après la suite générale Chromium, avec un rapport JSON distinct.

## Publication ultérieure

Publier le script `/widget.js` et les pages `/embed/...` de la même révision sur l’adresse publique de réservation, puis le portail organisateur qui utilise cette adresse via `PUBLIC_BOOKING_URL`. Publier uniquement le portail alors que le calendrier public reste sur l’ancienne révision ferait échouer son nouveau contrôle de disponibilité.

Cette évolution ne nécessite pas de migration SQL. Conserver les paramètres de TEST, les protections de la recette et le domaine stable utilisé pour la sécurité des comptes. L’activation des paiements et e-mails réels reste prévue dans le plan de finition. Les anciens codes continuent à charger le script ; recopier le nouveau code ajoute le lien indépendant disponible même si ce script est bloqué.

## Résultats locaux du 21 novembre 2026

| Contrôle | Résultat |
| --- | --- |
| TypeScript, ESLint et tests unitaires | 240 tests réussis |
| Intégration PostgreSQL | 173 tests réussis |
| Suite générale Chromium | 212 parcours réussis, aucun ignoré |
| Robustesse de l’intégration sur Chromium | 13 scénarios réussis |
| Robustesse de l’intégration sur Firefox | 13 scénarios réussis |
| Robustesse de l’intégration sur WebKit | 13 scénarios réussis |
| Compilation de production | Réussie |
| Traces d’exécution | 84 manifestes, aucune dépendance de développement interdite |

La suite générale a précédé la dernière correction de validation d’adresse. Les contrôles de code et les 13 scénarios de robustesse ont été rejoués après recompilation sur les trois moteurs. Une adresse vide ou mal formée produit désormais un refus de validation au lieu d’une exception. Les tests attendent aussi le vrai formulaire avant de mesurer l’iframe et acceptent le refus immédiat signalé par Firefox, tout en exigeant le même état d’erreur et le lien public.

Les captures ont été inspectées pour l’intégration mobile, la fenêtre flottante, le contrôle d’installation et le message de reprise. Les contrôles de largeur couvrent 320, 390, 768 et 1440 pixels. Les captures d’iframe utilisent une fenêtre visible et attendent le contenu : une capture pleine page prise trop tôt sous Chromium pouvait omettre des parties pourtant visibles à l’écran.

Conditions locales : WebKit utilise des bibliothèques système extraites dans l’espace de travail ; Firefox utilise un profil XDG temporaire et `MOZ_DISABLE_CONTENT_SANDBOX=1`, le conteneur refusant ses espaces de noms Linux. Ces réglages concernent uniquement les navigateurs de test locaux. Le workflow CI installe les dépendances officielles et garde les paramètres de lancement habituels.

Les essais réels sur Mi, Safari/iPhone et les navigateurs intégrés aux réseaux sociaux restent à réaliser. Les paiements ont été vérifiés en simulation ; les prestataires réels restent dans le plan de finition. Cette branche est préparée localement, sans fusion ni publication Vercel effectuée pour cette évolution.
