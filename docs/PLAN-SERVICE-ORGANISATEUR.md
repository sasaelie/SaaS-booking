# Plan de réalisation — service organisateur

Autorisation : coder et tester sur une branche de travail. Aucun déploiement, envoi réel, encaissement ou changement de base hébergée.

Réalisation locale terminée et vérifiée : voir [RAPPORT-SERVICE-ORGANISATEUR.md](RAPPORT-SERVICE-ORGANISATEUR.md). Les raccordements hébergés restent hors de cette autorisation.

## Décisions retenues

- Liens WhatsApp, Facebook, Instagram et autres réseaux proposés, facultatifs, affichés avant réservation avec icônes accessibles.
- Détails pratiques par activité : adresse, visibilité publique ou communication différée, résumé et consignes. Une adresse différée ne traverse jamais les données publiques.
- Conditions préremplies, personnalisables et consultables avant réservation sous « Consignes de participation et droit au remboursement ». Texte et paramètres acceptés conservés par réservation.
- Confirmation après validation de la réservation ; rappel 24 heures avant pour les réservations confirmées non annulées. Réservation tardive : détails dans la confirmation, sans rappel redondant. Fuseau de l’organisation respecté.
- Attribution manuelle depuis une réservation annulée, valeur vérifiée, confirmation et journal. Expiration proposée à deux mois, modifiable avant attribution. Aucun double crédit ni cumul avec un remboursement.
- Code utilisé sur une activité moins chère : création unique d’un nouveau code pour le reliquat à la confirmation définitive. Expiration héritée du code source. Conservation de valeur lors des reprises et annulations.
- Pastilles vert/orange/rouge/gris avec libellés : règlement distinct de l’inscription ; accès offert distinct d’un abonnement payé ; prochaine échéance distincte d’une fin effective d’accès.

## Lots et critères de sortie

| Lot | Réalisation | Preuve attendue |
|---|---|---|
| 1 | Validations, contrats et migration additive des préférences, données pratiques, règles figées et filiation des codes | Anciennes données lisibles ; contraintes et clés tenant conservées |
| 2 | Réglages réseaux et détails ; données publiques filtrées ; conditions | URL dangereuse refusée ; adresse différée absente HTML/RSC/API ; conditions acceptées non modifiées rétroactivement |
| 3 | Codes manuels et reliquats | Autorisation serveur ; double clic et concurrence idempotents ; somme des valeurs conservée ; expiration héritée ; remboursement incompatible refusé |
| 4 | Confirmation enrichie et rappel planifié | Déduplication ; annulation ; horaires et changements de date ; réservation tardive ; panne puis reprise ; aucun détail privé au mauvais destinataire |
| 5 | Pastilles et états explicites | Gratuit/code/sur place non présentés comme encaissés ; abonnement renouvelable conservé vert ; fin réelle proche orange |
| 6 | Recette complète et rapport | TypeScript, ESLint, unitaires, PostgreSQL et Chromium ; aucun test ignoré ; compilation ; captures mobile et ordinateur |

## Scénarios de référence

1. Organisateur A renseigne ses réseaux et une adresse différée ; B ne peut ni lire ses données privées ni les modifier.
2. Participant réserve ; les conditions affichées sont figées et la confirmation décrit le règlement réel.
3. Modifier les règles de l’activité ne change pas l’éligibilité de la réservation antérieure.
4. Annulation sans code puis attribution autorisée ; double demande simultanée produit un seul code et une seule notification.
5. Code de 30 EUR utilisé pour 20 EUR : ancien code consommé et nouveau code de 10 EUR avec même expiration. Deux traitements concurrents ne créent pas 20 EUR.
6. Paiement complémentaire abandonné : aucun reliquat anticipé ; verrou libéré selon les règles existantes.
7. Rappel dû, réservation annulée, réservation à moins de 24 h, changement d’heure et passage été/hiver : destinataire et horaire corrects, pas de doublon.
8. Réservation sur place confirmée mais impayée : statut orange ; abonnement renouvelable à échéance demain : accès vert.

## Vérification et livraison

Base locale jetable `booking_test` uniquement ; prestataires simulés. `npm run verify`, `npm run test:integration`, compilation staging, parcours Chromium puis `npm run test:summary`. Rapport final avec résultats et limites, inventaire et manifeste à jour. Aucun résultat local ne vaut preuve de livraison réelle par Resend.

L’ordonnanceur et le domaine d’envoi hébergés seront raccordés lors d’une tâche de déploiement distincte. Les cinq confirmations observées en attente dans la recette ne seront pas déclenchées par ce chantier local.
