# Plan de migration et recette — Liberté / Studio Pro

Plan du 11 novembre 2026, basé sur le cahier des charges consolidé et l'audit du dépôt.
L'application demeure en recette ; les contrôles ci-dessous sont à réaliser, pas réputés réussis.

## Étape 1 — Règles et contrats

- Centraliser offres, capacités, tarifs, arrondis et périodicités en constantes versionnées.
- Séparer Pro payé, Pro offert, grâce, suspension et disponibilité du compte Stripe marchand.
- Définir l'assiette après utilisation partielle d'un avoir et le minimum de paiement accepté.
- Fixer le traitement des frais/remboursements partiels et leur présentation sur les reçus.
- Définir la TVA applicable, la présentation HT/TTC et l'allocation des coûts exceptionnels.
- Définir « QR affiche HD » et le parcours « report vers un cours en ligne » avant leur UI.
- Reprendre les conditions configurables ; ne pas imposer 72 heures à toutes les associations.

Sortie : exemples chiffrés et schémas d'entrée explicites ; aucun tarif commercial ambigu.
Pour chaque fonctionnalité, suivre l'ordre du dépôt : validation, port, test, métier, adaptateur, UI.

## Étape 2 — Préparer la migration additive

1. Travailler sur une base locale isolée avec fixtures synthétiques, jamais sur la base hébergée.
2. Ajouter les droits/version de migration et le journal financier avant d'utiliser leurs données.
3. Ajouter les montants réels nullable, états d'attente et références de rapprochement uniques.
4. Contraindre les liens par organisation, les montants/devise et l'unicité des événements externes.
5. Vérifier les index de portée, les droits SQL et la protection des tables nouvellement exposées.
6. Exécuter deux fois migration et reprise : pas de duplication, pas de référence perdue.
7. Étiqueter les ventes historiques sans inventer de frais réels ou de commissions encaissées.

Les comptes de test à 19,99 € sont des fixtures de transition ; leurs réservations restent présentes.
Les anciens prix Stripe restent historiques. Les nouveaux prix mensuel/annuel sont des références
de test distinctes et validées côté serveur sur montant, devise et périodicité.
Les accès offerts restent gérables avec journal d'audit ; la suspension conserve sa priorité.

Sortie : migrations relisibles, rapport de simulation avant/après et retour arrière documenté.

## Étape 3 — Droits et réservation

- Calculer les droits une seule fois dans le domaine, puis les recontrôler à la mutation SQL.
- Sérialiser les publications par organisation pour respecter la limite face à la concurrence.
- Appliquer les mêmes règles au catalogue, au paiement, aux appels directs et à l'embed.
- Distinguer brouillon, activité publiée et activité ouverte aux nouvelles réservations.
- Conserver prix, droits et délais du dossier engagé ; gérer le prochain achat avec la formule courante.
- Refuser l'activation d'un nouveau virement en Liberté, sans refuser la validation d'un ancien.
- Prévenir de l'expiration, recueillir les deux activités retenues et appliquer un repli stable.

Sortie : parcours Pro → Liberté opérationnel sans perte de dossier ni vente à un tarif incohérent.

## Étape 4 — Stripe et journal exact

- Valider le montage Connect : marchand, compte porteur, débit des frais, commission et transfert.
- Tester les deux formules avec les mêmes prix faciaux ; aucune surcharge liée au moyen de paiement.
- Activer explicitement Bancontact dans Checkout et gérer ses résultats différés.
- Confirmer les réservations sans attendre le rapprochement financier asynchrone.
- Récupérer les frais réels depuis les objets du bon compte ; reprendre si l'objet est absent.
- Journaliser remboursement, contestation et ajustement sans réécrire l'écriture d'origine.
- Calculer le compteur et les exports uniquement à partir d'écritures rapprochées et tracées.
- Distinguer net dû, transfert Stripe et versement bancaire effectif.

Les doubles locaux vérifient les erreurs et la concurrence. Ils ne remplacent pas Stripe Sandbox.
Un paiement Sandbox ne certifie ni les coûts contractuels ni les prélèvements d'un paiement réel.
L'absence de clés de test est signalée ; aucun secret réel n'est demandé dans la conversation.

## Étape 5 — Conservation trente jours / dix ans

- Cartographier contacts, fichiers, pièces comptables, tâches et logs contenant des coordonnées.
- Calculer la clôture du dossier à partir de ses opérations, pas de sa seule date de création.
- Garder tout dossier dont l'événement, le paiement, le remboursement, le litige ou un avoir lié est actif.
- Distinguer justificatif non fiscal et pièce nécessaire à une obligation légale.
- Purger les données opérationnelles trente jours après clôture, par lots et avec recontrôle transactionnel.
- Garder les pièces comptables nécessaires dix ans, avec accès restreint et échéance adaptée.
- Prévoir procédure d'effacement, copie de sauvegarde, restauration et exception documentée.
- Réaliser d'abord une simulation listant des identifiants techniques et raisons, sans afficher de coordonnées.

Sortie : aucun effacement sur une simple comparaison « date de création + trente jours ».

## Matrice de tests d'acceptation

| Cas | Vérification attendue |
| --- | --- |
| Prix de 30 €, Liberté | Participant débité 3 000 ; commission 150 ; net association 2 850 |
| Frais Stripe 70, rapprochés | Part évitable 80 ; vingt dossiers = 1 600 ; trente-sept = 2 960 |
| Bancontact | Succès et échec réels de test, frais issus du compte correct |
| Frais absents puis disponibles | Attente visible puis rapprochement unique, sans zéro inventé |
| Paiement récent non rapproché | Exclu des économies acquises et compté séparément |
| Montant faible / élevé / arrondi | Calcul entier, net valide, aucun plafond, minimum prestataire respecté |
| Réservation gratuite / avoir complet | Pas de débit Stripe ni fausse commission d'encaissement |
| Avoir partiel / reliquat | Assiette et journal conformes à la règle explicitement retenue |
| Remboursement complet / partiel | Écritures liées, frais réels préservés et compteur corrigé |
| Webhook faux / doublé / désordonné | Signature vérifiée, état canonique, une seule réservation et écriture |
| Rapprochement rejoué | Aucun double frais ni double économie |
| Deux publications concurrentes | Maximum deux activités ouvertes en Liberté |
| Pro expiré avec cinq activités | Deux choisies ou repli stable ; trois consultables, aucune suppression |
| Virement engagé avant expiration | Instructions et échéance initiales maintenues ; validation autorisée |
| Nouvelle réservation après expiration | Conditions Liberté, aucun nouveau virement |
| Carte engagée avant expiration | Prix et délai initiaux maintenus, pas de nouvelle période gratuite |
| Compte offert / grâce / suspendu | Transition auditée ; la suspension prévaut |
| Ancien compte à 19,99 € | Références conservées, aucune facturation nouvelle silencieuse |
| Mensuel / annuel | Montant/devise/période validés ; pas de double abonnement ni droit anticipé |
| Accès croisé A → B | Lecture, modification, export et preuve privée refusés |
| Code report A → B | Code refusé sans fuite de données ni consommation |
| Lien annulation altéré ou réutilisé | Portée du dossier, signature et version vérifiées |
| Conditions de report non remplies | Aucun code généré ; motif explicite |
| Appel Pro direct en Liberté | Virement nouveau, troisième publication, export et widget refusés |
| Administration financière | Revenus plateforme séparés du volume et des fonds des associations |
| Trente jours après clôture | Purge opérationnelle au seuil retenu et seulement après recontrôle |
| Événement futur / avoir / litige actif | Pas de purge, même pour une réservation ancienne |
| Pièce comptable encore requise | Mentions nécessaires préservées, accès restreint |
| Purge répétée / reprise de fichier | Idempotence, pas de suppression d'une pièce à conserver |
| Mobile et ordinateur | Prix, économies, états et actions lisibles, alignés et accessibles |

Les six familles obligatoires sont présentes : accès croisé, code croisé, annulation limitée,
verrouillage Pro, idempotence et séparation financière. Ajouter leurs scénarios concurrents.

## Étape 6 — Recette et publication

Exécuter `npm run verify`, les tests SQL isolés, le build et les parcours navigateur pertinents.
Relier chaque résultat à un scénario de la matrice ; distinguer doublure, Sandbox et service hébergé.
Fournir captures, rapport, limites restantes et URL de prévisualisation avant toute ouverture réelle.
Le lien de recette existant reste :
https://saas-booking-recette-elis-projects-ddf0bd9d.vercel.app/app

Une migration hébergée nécessite les vérifications et autorisations applicables à cette étape.
Ne pas appliquer les anciens binaires sur un journal qui contient déjà de nouvelles ventes :
le retour arrière doit préserver écritures, paiements et responsabilités des dossiers existants.
Pas de suppression destructive de l'historique pour simplifier la bascule.

## État de ce livrable

Cahier des charges, audit du code et plan de migration préparés.
Le moteur des deux offres, la purge trente jours et le journal financier ne sont pas encore codés.
Les tests de cette matrice ne sont pas encore exécutés ; ils ne doivent pas être annoncés comme réussis.
