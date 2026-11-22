# Plan validé — parcours, regroupement et communications

Accord utilisateur du 21 novembre 2026, y compris newsletters et messages de réservation.
Branche de départ : `feat/resilient-embed`, commit `0e0078b`.

## Suivi

1. [x] Reproduire les incohérences et fixer les emplacements des actions. Navigation principale regroupée, anciennes adresses conservées.
2. [x] Corriger complément de report, validation bancaire sans capture et règlement sur place tracé. Le minimum Stripe ne bloque plus les petits compléments bancaires Pro.
3. [x] Prévisualiser les conséquences d’annulation et clôturer l’accès des dossiers entièrement terminés après 30 jours, en protégeant les droits encore actifs et les archives nécessaires. Migration 028 appliquée uniquement sur la base locale isolée.
4. [x] Modifier les séances avec contrôle des inscrits et notifications mises en file ; clarifier participant et contact du parent, une place par billet conservée. La réception réelle des notifications dépend du lot 5.
5. [ ] Finaliser identité d’envoi, réponses vérifiées, billet et récupération, suivi des notifications.
6. [ ] Ajouter newsletters, consentement par organisation, aperçu/test, désinscription et limites d’envoi.
7. [ ] Compléter les statistiques globales du parcours et des envois.
8. [ ] Vérifier fonctions, isolation, sécurité, rendu responsive et livraison.

## Navigation validée

- Organisateur : Accueil, Activités, Participants, Partager, Réglages.
- Participants reprend les réservations et regroupe les communications ; un message de séance reste accessible depuis sa fiche.
- Partager regroupe liens, intégration, aperçu et tests.
- Réglages regroupe identité/contact, apparence, paiements et formule ; les paramètres d’e-mail se trouvent avec l’identité/contact.
- Administration : Organisations, Finances, Utilisation, Suivi, Paramètres. Suivi regroupe opérations et historique.
- Préserver les liens et fonctionnalités validés, les couleurs, le verre et les effets. Privilégier une action principale par tâche et des détails contextuels aux nouveaux menus et cadres.

## Communications

- Resend transporte les e-mails ; un domaine contrôlé et authentifié autorise leur expéditeur réel.
- Envoi standard : nom de l’organisateur affiché, domaine technique de la plateforme visible, réponses vers une adresse vérifiée de l’organisateur.
- Les messages de compte/sécurité identifient la plateforme. Les réservations et actualités identifient l’organisateur.
- Prévoir le domaine propre à un organisateur en option avancée, après preuve de contrôle et authentification ; aucune usurpation d’adresse Gmail/Outlook.
- Les abonnements newsletter sont distincts des réservations et propres à chaque organisation. La désinscription marketing ne coupe pas les messages nécessaires aux réservations.
- Séparer les envois indispensables et les newsletters ; contrôler quotas, erreurs permanentes et plaintes. Aucun envoi collectif ne dévoile les autres destinataires.
- Le raccordement réel du domaine et les essais de réception nécessiteront le domaine choisi et des adresses de test confirmées. Préparer le code et les simulations sans activer d’envoi réel arbitraire.

## Garde-fous d’exécution

- Schémas, contrats et tests précèdent adaptateurs et interfaces ; migrations versionnées, d’abord sur base locale isolée.
- Écritures financières tracées et idempotentes ; tarifs, droits déjà accordés et historique préservés.
- Exécuter les contrôles adaptés à chaque lot et `npm run verify` avant de le considérer terminé.
- Les comptes rendus indiquent le lot en cours, les vérifications réussies et ce qui reste à faire.

## Vérification du premier ensemble — 22 novembre 2026

- TypeScript, ESLint et 246 tests unitaires réussis.
- Suite PostgreSQL complète : 185 tests réussis, comprenant isolation, concurrence, remboursements, droits des participants et reprise d’accès après clôture.
- Compilation optimisée réussie. Parcours Chromium ciblés : 29 tests réussis, dont création d’activité, billets, justificatif, déconnexion, anciennes routes et nouvelles actions. Contrôle visuel des captures mobile et ordinateur ; correction d’un lien d’aperçu masqué sur mobile, puis recontrôle ciblé.
- Formats vérifiés dans les parcours de gestion : 320 px, 390 px et 1440 px. Ces contrôles ne constituent pas la recette de toutes les nouvelles fonctions de messagerie : les lots 5 à 8 restent ouverts.
- Travail local sur `feat/workflow-communications`. Aucun déploiement Vercel ni migration distante de ce premier ensemble. Aucun envoi d’e-mail réel activé.

## Identité des e-mails — fonctionnement prévu

Resend est le transporteur des messages préparés par l’application. Le domaine de la plateforme authentifie leur adresse d’envoi technique. Il sert aux messages de compte, aux réservations et aux newsletters, pas uniquement aux messages du propriétaire vers les organisateurs.

Un message de réservation ou une newsletter doit afficher le nom de l’organisateur et la mention de la plateforme. Son adresse d’envoi reste sur le domaine authentifié de la plateforme ; son adresse de réponse est une boîte vérifiée de l’organisateur. Les organisateurs n’ont pas à configurer leur propre DNS dans ce fonctionnement standard. L’envoi depuis leur propre domaine sera une option avancée avec vérification.

Cette identité par organisateur et les newsletters sont encore à implémenter dans les lots 5 et 6. L’intégration actuelle de Resend ne prouve pas à elle seule qu’un domaine est authentifié ou que tous ces parcours sont déjà opérationnels.
