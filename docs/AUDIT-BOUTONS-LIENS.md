# Audit des boutons et des liens — 11 novembre 2026

## Périmètre et méthode

Code de départ : `95572d42d1b910bc42932e8d34d64269241287d6`, installé sur la recette Vercel.
L'inventaire syntaxique relève 118 déclarations de commandes, liens et sections repliables dans
71 fichiers TSX : 33 Link, 29 button, 10 a, 22 summary, 6 AdminOperation et 18 PortalForm.
Ce sont des déclarations de composants, pas 118 boutons distincts visibles simultanément : les
formulaires et menus sont réutilisés pour plusieurs objets et plusieurs états.

[Inventaire des points d'entrée](audit-actions/inventaire.json).

La recette par clic utilise Chromium, l'authentification normale et une copie locale du code,
avec des comptes vérifiés fictifs dans la base jetable `booking_test`. Les commandes ne sont pas
remplacées par des réponses simulées dans les nouveaux parcours. Les effets importants sont
vérifiés en base : publication, séance, pause, choix Liberté, avoir consommé, coût et remboursement.
Les téléchargements sont déclenchés par leurs liens ; la copie est lue dans le presse-papiers.
Les tests de navigation joignent l'inventaire des contrôles visibles par écran et largeur.

Aucune réservation du propriétaire n'est utilisée pour une annulation ou une décision bancaire.
Aucune donnée hébergée n'est modifiée par cette recette locale et aucun e-mail réel n'est envoyé.

## Anomalie confirmée et correction

**Valider le report pour un cours en ligne** consommait correctement le code mais renvoyait ensuite
vers le tableau de bord. Le gestionnaire commun interprétait la présence d'`organizationId` dans
n'importe quel résultat comme une création d'espace ; la confirmation disparaissait.

La navigation automatique par identifiant est désormais réservée à la création d'espace et à la
création d'activité. Les autres formulaires restent sur leur écran et actualisent leurs données.
Les redirections explicites vers les prestataires via `data.url` restent prises en charge.
Le nouveau parcours échoue avec l'ancien code et réussit avec le correctif : confirmation visible,
statut `USED_FOR_EXTERNAL_BENEFIT` en base et refus de la seconde utilisation du même code.

## Matrice des commandes

| Famille | Résultat contrôlé | Preuve principale |
| --- | --- | --- |
| Accueil, inscription, connexion, récupération | Destination réelle des liens ; messages et validation | action-navigation, password, tests SQL auth |
| Déconnexion | Redirection, session nulle et refus de retourner dans l'espace privé | action-navigation |
| Menu organisateur et Retour | Chaque destination, menu mobile refermé, retour au tableau de bord | action-navigation ; 1440 et 390 px |
| Création d'espace et lien personnalisé | Un seul espace créé, nom de lien validé et destination correcte | portal, organization-link, empty-states |
| Création et modification d'activité | Données sauvegardées et titre réellement visible sur la page publique | portal, action-management |
| Ajouter et retirer un créneau | Seule la ligne conservée est publiée ; dernière ligne non supprimable | action-secondary |
| Ajouter une séance et une pause | Séance ajoutée sans écraser l'ancienne ; intervalle de pause enregistré | action-management, tests SQL bank-and-pause |
| Archiver et republier | Fermeture puis réouverture de la réservation ; état enregistré | action-management |
| Séances du tableau de bord | Détail et inscrits correspondants ; pagination et retour cohérents | session-details |
| Filtres des inscrits | Recherche et filtres de paiement changent réellement les résultats | action-filters-admin |
| Copie des liens et scripts | Valeur correcte dans le presse-papiers ; message de résultat | action-navigation ; embed pour les scripts |
| QR PDF/PNG et export CSV | Vrais téléchargements ; formats et contrôle Pro | action-navigation, commercial |
| Apparence, sélecteurs, défauts et enregistrement | Prévisualisation puis persistance ; retour participant | appearance, presentation, participant-return |
| Importer et retirer une image | Image publiée puis référence retirée et URL introuvable | story-photo, action-secondary |
| Choisir les deux activités Liberté | Choix sauvegardé et appliqué au retrait Pro ; autres activités non réservables | action-commercial |
| Actualiser l'état | Nouvel état commercial visible après changement de fixture | action-commercial |
| Administration : offrir, retirer, suspendre, rétablir | Droits effectifs et commandes interdites après retrait | action-filters-admin, administration |
| Enregistrer un coût | Organisation et montant exact en centimes enregistrés | action-commercial |
| Codes de report | Attribution, application, reliquat et usage unique | organizer-service, action-commercial, tests SQL vouchers |
| Calendrier et Continuer | Choix et changement de séance, navigation au clavier, données conservées | interface, booking, journey-recovery |
| Conditions et détails | Sections et lien des conditions accessibles ; adresse différée non exposée | organizer-service, journey-audit |
| Réserver et gérer sa place | Réservation persistée puis gestion par lien limité | booking, commercial, service-recovery |
| Envoyer et consulter un justificatif | Import réel puis fichier privé consultable avec contrôle d'accès | bank-proof, service-recovery |
| Confirmer ou refuser un virement | Confirmation réelle ou annulation sans encaissement déclaré | bank-proof, action-secondary |
| Enregistrer un remboursement bancaire | Référence enregistrée et commande d'attente retirée | action-secondary |
| Annuler un inscrit ou une séance | Confirmation des conséquences et tâches de notification durables | session-details, tests SQL cancellation-notifications |
| Réessayer après une erreur | Contexte et justificatif réessayables, sans doublon de réservation | service-recovery, journey-recovery |

## Limites à conserver visibles

Les essais connectés sur Vercel restent limités par sa protection et l'absence d'une session
applicative du propriétaire dans le navigateur de l'agent. Les résultats par clic ci-dessus sont
ceux de la recette locale du même code ; ils ne certifient pas chacun des clics sur le site hébergé.
Aucune protection ni vérification d'identité n'est contournée pour compléter l'audit.

Les contrôles de paiement et de facturation sont volontairement masqués ou désactivés en staging :
connexion Stripe, souscription mensuelle/annuelle, résiliation, portail de facturation et paiement.
Leurs signatures et opérations restent couvertes par les tests du SDK et SQL ; les écrans externes
et les paiements Bancontact/carte doivent être vérifiés dans le service Stripe Sandbox séparément.
La livraison réelle des e-mails ne découle pas d'un test de clic local.

Les destinations des liens sociaux et mailto sont contrôlées, sans envoyer de message, s'authentifier
chez un réseau social ou certifier l'existence d'un compte tiers.
Les états futurs et les combinaisons de saisie ne sont pas épuisés par une liste finie de scénarios.

## Résultats de la recette finale

| Vérification | Résultat |
| --- | --- |
| TypeScript, ESLint et tests unitaires (`npm run verify`) | Réussis, 86 tests unitaires |
| Tests PostgreSQL isolés | Réussis, 108 tests |
| Build Next.js du correctif | Réussi |
| Recette Chromium complète | Réussie, 61 parcours en 2,1 minutes |
| Nouveaux parcours par clic inclus dans la recette | 16 |
| Inventaire statique | 118 déclarations dans 71 fichiers |

Les 16 nouveaux parcours couvrent les zones jusque-là souvent vérifiées seulement par API.
Les traces des premiers essais ont permis de distinguer la redirection fautive des erreurs de
sélecteurs de tests et des attentes prématurées pendant l'enregistrement ; les assertions finales
attendent une confirmation ou la réponse du serveur avant de conclure à un changement en base.

Le correctif reste proposé dans `codex/audit-actions-links` ; aucune fusion ni nouvelle
publication Vercel n'est effectuée pendant cet audit.
