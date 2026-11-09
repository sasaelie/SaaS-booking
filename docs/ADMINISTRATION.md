# Administration de la plateforme

L’administration utilise le compte habituel de l’exploitant. Depuis l’espace organisateur, ouvrir **Menu → Administration**, ou directement `/plateforme`. Le lien est visible uniquement pour un compte présent dans `platform_operators`. Après une attribution, actualiser la page pour recharger le menu.

## Les trois vues

| Vue | Utilisation |
|---|---|
| Organisations | Rechercher un nom ou un lien de réservation ; consulter le responsable, les compteurs d’activités et de réservations et l’état de l’accès. |
| Gérer l’accès, dans une carte d’organisation | Accorder ou retirer un accès offert ; suspendre les nouvelles réservations ou lever la suspension. Chaque action exige une confirmation et crée une intervention dans l’historique. |
| Opérations en attente | Lire les traitements différés, leur organisation, leurs tentatives, leur date et la prochaine tentative possible. Les échecs sont présentés en premier. |
| Historique | Rechercher les interventions sur les accès et consulter leur auteur et leur date. Les événements sans organisation sont rattachés à « Plateforme ». |

Le retour vers l’espace organisateur reste disponible sur les trois vues. Les listes sont paginées et adaptées au mobile. L’onglet actif est signalé visuellement et par `aria-current`.

## Portée des actions

L’accès offert concerne l’abonnement de l’organisation à la plateforme ; il ne règle pas les activités des participants. Le retrait d’un accès offert ne crée aucun abonnement payant. Le serveur refuse d’accorder un accès offert à un espace déjà rattaché à un client Stripe, afin d’éviter une modification ambiguë de sa facturation.

La suspension bloque les nouvelles réservations. L’organisateur conserve l’accès aux inscriptions existantes. Les écrans de participants et les inscriptions d’une organisation restent dans son espace organisateur : l’administration n’ajoute aucun mécanisme d’usurpation de compte.

Le suivi des opérations est consultatif. Il n’envoie pas de messages, ne rembourse pas et ne déclenche pas de tâche. Les traitements restent exécutés par l’ordonnanceur authentifié décrit dans [OPERATIONS.md](OPERATIONS.md). Une « prochaine tentative possible » ne signifie pas qu’un ordonnanceur est raccordé. Les prestataires doivent être configurés pour qu’un traitement aboutisse.

## Accès et données

- Le rôle plateforme est distinct du rôle de propriétaire d’une organisation. Créer un compte ou une organisation n’accorde aucun droit plateforme.
- Chaque lecture globale et chaque intervention vérifie le rôle côté serveur, y compris lorsqu’une URL est appelée directement. Le masquage du menu est uniquement un repère d’interface.
- Les opérations sélectionnent uniquement leurs métadonnées. Le contenu des notifications, les justificatifs, les clés de stockage et les jetons ne sont pas renvoyés à ces écrans. Les erreurs sont traduites depuis leurs codes ; les messages bruts des prestataires ne sont pas affichés.
- L’attribution initiale au compte vérifié de l’exploitant a été réalisée une seule fois dans la base de recette, avec une trace `PLATFORM_ADMIN_GRANTED`. Les nouveaux administrateurs ne sont pas ajoutés depuis cette interface.
- Aucune migration de schéma n’est nécessaire pour ces vues : les tables de rôles, d’historique et de tâches existaient déjà.

## Vérification de cette évolution

Les tests PostgreSQL couvrent le refus des organisateurs ordinaires, l’absence de contenu confidentiel dans les réponses, l’historique d’une suspension, les recherches, la pagination stable, l’exclusion des tâches terminées et la priorité des échecs.

Les parcours Chromium vérifient l’entrée du menu, le refus des trois routes et d’une mutation à un compte ordinaire, une suspension confirmée puis retrouvée dans l’historique, le retour à l’espace organisateur et les trois vues aux largeurs 320, 390 et 1280 px. Les identités et les interventions de ces tests utilisent exclusivement la base locale jetable `booking_test`.

Les rapports machine sont produits dans `qa-results/`, les captures dans `test-results/`. Exécuter les trois suites puis `npm run test:summary`, selon [PLAN-TESTS-SERVICE.md](PLAN-TESTS-SERVICE.md).

Résultat du 9 novembre 2026 : **48 tests unitaires, 59 tests PostgreSQL et 25 parcours navigateur réussis**, soit 132 cas sans test ignoré ou instable. TypeScript, ESLint et compilation Next.js réussis. L’accès du compte vérifié de l’exploitant et sa trace d’attribution ont aussi été relus dans la base hébergée ; la connexion avec son mot de passe reste un contrôle utilisateur.

Captures avec données fictives : [organisations sur mobile](previews/saas/administration-mobile.png), [opérations sur ordinateur](previews/saas/administration-operations.png), [historique sur mobile](previews/saas/administration-historique.png).
