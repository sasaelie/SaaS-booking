# Audit CX, UI et UX — 16 novembre 2026

## Périmètre et méthode

Audit heuristique du parcours participant (choix, coordonnées, confirmation, billet, gestion) et des principaux écrans organisateur (tableau de bord, navigation et apparence). Lecture du code, reproduction avec deux créneaux, réservation locale et sept captures avant correction, dont une en largeur 1440 px. Les données sont fictives et restent dans `booking_test`.

Ce travail n’est pas un test auprès de vrais clients, une mesure de conversion ou une certification WCAG. Les constats observés, les recommandations de référence et les propositions propres au produit sont distingués ci-dessous. Aucune statistique d’amélioration n’est inventée.

Identité conservée : palette personnalisable, vert de marque, verre transparent, ombres, typographie et arrondi de 8 px des boutons. L’objectif est de clarifier les états, la hiérarchie et les regroupements, sans refaire la marque.

## Diagnostic

Le problème principal n’est pas la forme carrée des boutons. C’est l’accumulation de contours et d’actions de même importance, dans des conteneurs déjà encadrés. Sur la confirmation mobile, le récapitulatif du paiement, le billet, le champ du code et les trois actions produisent plusieurs foyers visuels concurrents. Sur la gestion, l’activité, la date et le statut sont présentés deux fois avant les actions.

La lueur de catégorie apparaît sur tous les créneaux, alors que la sélection ne modifie pratiquement que la bordure. L’utilisateur voit que deux séances existent, mais ne reconnaît pas immédiatement celle qu’il vient de choisir.

## Constats et décisions

| Priorité | Observation et conséquence                                                                                                   | Ajustement motivé                                                                                                                                                                                                            | État                                                 |
| -------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| P0       | Deux créneaux semblables ; la sélection est peu perceptible. Risque de réserver une autre heure.                             | Éclairer toute la surface et le contour avec la couleur de l’activité, et ajouter une coche. Maintenir cet état au survol et au clavier. La coche permet de reconnaître la sélection sans dépendre uniquement de la couleur. | Correction locale                                    |
| P0       | Fermer la confirmation peut faire perdre le seul accès que le client a vu.                                                   | Déclencher après confirmation l’e-mail existant contenant le code personnel et le lien vers le billet. Le traitement serveur survit à la fermeture de la page ; un échec d’envoi ne doit jamais annuler la réservation.      | Déclenchement local ; activation d’envoi à finaliser |
| P0       | L’expéditeur Vercel utilise `resend.dev` ; aucun domaine n’est déclaré dans le compte Resend connecté.                       | Vérifier un domaine appartenant au propriétaire, puis configurer un expéditeur correspondant. L’expéditeur de test ne peut pas servir tous les participants. Ne pas afficher « envoyé » sans preuve d’envoi.                 | Domaine demandé                                      |
| P1       | Le code personnel dépasse la zone visible de son champ sur la capture de confirmation.                                       | Garder le champ en lecture seule et la sélection manuelle, mais supprimer son cadre intérieur et adapter son affichage au contenu. Placer « Copier le code » à côté de son libellé.                                          | Correction locale                                    |
| P1       | Le billet et le paiement sont des cadres dans le cadre principal.                                                            | Conserver la surface de verre principale ; séparer les sous-parties par les titres, l’espacement et une ligne discrète. Garder le fond blanc du QR pour sa lecture.                                                          | Correction locale                                    |
| P1       | Copier, enregistrer et gérer ont le même poids visuel.                                                                       | Réserver le grand bouton au téléchargement du billet ; rapprocher la copie du code et présenter la gestion comme un lien secondaire explicite et tactile.                                                                    | Correction locale                                    |
| P1       | L’activité, la date et le statut sont répétés dans la gestion.                                                               | Utiliser les informations du billet comme récapitulatif unique quand il existe. Conserver le résumé de secours pour les réservations sans billet.                                                                            | Correction locale                                    |
| P2       | Le tableau de bord cumule compteurs, carte de tests et calendrier ; les séances peuvent se trouver loin du début sur mobile. | Étudier un bandeau de compteurs et une présentation plus discrète des essais. Garder les accès aux essais et aux inscrits ; vérifier leur usage avant de déplacer ces fonctions déjà validées.                               | Recommandation, non appliquée                        |
| P2       | Le bandeau organisateur consacre plusieurs lignes à la marque, la navigation et le compte.                                   | Évaluer le regroupement du compte et de la déconnexion dans les utilitaires du menu mobile, en conservant la page courante et le retour visibles.                                                                            | Recommandation, non appliquée                        |
| P2       | Les réglages d’apparence comportent de nombreuses cartes et actions d’importation.                                           | Regrouper par tâche (identité, photo, textes et aperçu), sans retirer les indications de format, les statuts de chargement ou les actions de sauvegarde.                                                                     | Recommandation, non appliquée                        |

Les priorités sont une estimation de gravité pour ce produit : P0 peut empêcher de terminer ou retrouver une réservation ; P1 gêne la compréhension et la lecture ; P2 concerne l’optimisation de la disposition. Ce ne sont pas des scores statistiques.

Après réussite, le grand encart de présentation de l’activité est masqué sur la confirmation pour laisser la priorité au résultat et au billet. Il est conservé pendant le choix et la saisie. Le titre de confirmation devient le titre principal visible de la page. La marque et le fond restent présents. Cette réduction d’une répétition est une proposition locale à revoir visuellement, pas une suppression de la présentation de l’activité.

La suppression du résumé en double conserve les précisions de statut : une annulation par le participant reste distinguée d’une annulation par l’organisateur. Le test du parcours de simulation a permis de repérer cette information avant de la rétablir dans le billet.

Sur le calendrier participant à 390 px, les sept boutons de jour se répartissent sur deux lignes. Une piste complémentaire est un bandeau de jours sur une seule ligne, défilant sur les petits écrans, avec le jour choisi visible et des cibles tactiles suffisantes. Cette piste reste à essayer ; elle n’est pas appliquée dans cette correction.

## Disposition proposée pour la confirmation

1. Confirmation de la réservation et informations de paiement nécessaires.
2. Un billet sans second cadre : activité, organisation, date, participant, statut et montants.
3. QR code, puis code personnel entièrement visible et copie à proximité.
4. Un bouton principal « Enregistrer le billet PDF ».
5. Un lien secondaire « Gérer ma réservation ».
6. Consignes et droits accessibles ensuite, sans les mélanger avec les actions du billet.

Cette hiérarchie est une proposition adaptée au besoin exprimé de conserver une preuve. GOV.UK recommande une action dominante ; il ne prescrit pas que le téléchargement soit toujours cette action. Le choix pourra être réévalué après des essais avec des participants.

## Recommandations de disposition à essayer ensuite

Ces propositions ne sont pas appliquées aux écrans validés. Elles décrivent un emplacement et un objectif précis, à comparer visuellement avant une réorganisation plus large.

| Écran                              | Disposition proposée                                                                                                                                                                              | Justification et information à préserver                                                                                                                                                                                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Coordonnées du participant         | En haut du formulaire, un récapitulatif compact activité, tarif et séance ; la modification de séance en action secondaire sur une ligne dédiée si nécessaire.                                    | À 390 px, le grand encart de présentation précède encore les champs et « Modifier la séance » se répartit sur trois lignes. Le récapitulatif doit rester lisible avant toute confirmation, sans reproduire toute la présentation.                                              |
| Coordonnées du participant         | Coordonnées, code de report repliable, consentements nécessaires, montant final, puis confirmation. Séparer visuellement l’inscription facultative aux actualités des consentements obligatoires. | Maintenir les labels et l’indication « facultatif » ; conserver l’accès aux conditions au moment du consentement. Le détail des conditions apparaît également sous le formulaire : étudier un même panneau accessible depuis les deux liens plutôt que deux blocs concurrents. |
| Tableau de bord organisateur       | Titre et action « Créer une activité », puis compteurs regroupés dans un seul bandeau, puis prochaines séances. Placer les essais dans les utilitaires ou après les séances.                      | Réduire la hauteur avant le calendrier et les contours des quatre compteurs. Les virements ou remboursements à traiter doivent rester visibles et accessibles, surtout si leur nombre est non nul. Garder un accès explicite aux tests.                                        |
| Navigation organisateur sur mobile | Une ligne pour retour, page courante et menu ; identité du compte et déconnexion dans les utilitaires du menu.                                                                                    | Le bandeau actuel occupe trois niveaux avant les fonctions métier. Préserver l’orientation, l’accès au compte et une déconnexion facilement retrouvable.                                                                                                                       |
| Apparence                          | Regrouper identité, visuel et textes avec des titres et de l’espacement ; placer l’aperçu à côté sur grand écran et après le groupe édité sur mobile.                                             | Conserver les actions réelles d’importation et de sauvegarde, les formats autorisés et la diode de chargement. Éviter un cadre par champ et un aperçu flottant qui masquerait les commandes sur mobile.                                                                        |

## E-mail : fonctionnement et limites constatés

Le contenu de confirmation comportait déjà le code `CLI-…` et `/manage#code=…`. La réservation est enregistrée avec une tâche `CONFIRMATION` dans la même transaction. Le problème n’était donc pas l’absence de modèle d’e-mail.

Avant correction, l’action de réservation ne lançait pas cette tâche immédiatement. L’API d’exploitation `POST /api/jobs` pouvait vider la file, mais aucun calendrier Vercel n’est déclaré dans le dépôt. La présence de `CRON_SECRET` ne prouve pas qu’un ordonnanceur externe fonctionne.

La correction programme le traitement serveur après la réponse à la réservation. Le code signé fournit l’organisation et la réservation à traiter. Le travail est limité à cette confirmation : pas de vidage global des remboursements ou d’envoi aux autres organisations. Les confirmations de paiement validées par webhook utilisent également un périmètre vérifié. La simulation participant reste séparée et n’envoie aucun e-mail réel.

Une erreur conserve la tâche pour reprise avec la même clé d’idempotence et conserve la réservation confirmée. La reprise automatique régulière reste à raccorder à un ordonnanceur authentifié ; elle n’est pas certifiée par les tests locaux. L’e-mail existant donne accès au billet téléchargeable ; aucune pièce jointe PDF supplémentaire n’est ajoutée.

L’envoi à tous les destinataires est bloqué tant que l’expéditeur reste `resend.dev`. Un domaine vérifié et un test de réception réel restent nécessaires. Aucun message réel n’a été envoyé pendant cet audit et aucune modification DNS n’a été faite.

## Références consultées

- [W3C — contraste non textuel, WCAG 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) : les indications nécessaires à l’identification d’un état doivent être discernables. Une lueur décorative seule ne démontre pas la conformité.
- [W3C — utilisation de la couleur, WCAG 1.4.1](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) : une information ne doit pas reposer exclusivement sur la couleur ; d’où la coche en plus de l’éclairage.
- [W3C — taille minimale des cibles, WCAG 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum) : minimum AA de 24 × 24 CSS px, avec exceptions d’espacement. Les actions compactes de cette correction gardent une hauteur de 44 px comme choix de confort tactile ; 44 px n’est pas présenté comme le minimum AA général.
- [GOV.UK — boutons](https://design-system.service.gov.uk/components/button/) : limiter la concurrence entre actions principales et distinguer les actions secondaires.
- [GOV.UK — pages de confirmation](https://design-system.service.gov.uk/patterns/confirmation-pages/) : préciser la suite, permettre de conserver une preuve et de revenir au résultat lorsque c’est possible.
- [Nielsen Norman Group — principes de conception visuelle](https://www.nngroup.com/articles/principles-visual-design/) : hiérarchie, contraste et regroupements perceptifs. Le regroupement par espacement est ici une application à notre interface, pas une obligation de supprimer toute carte.
- [Resend — restriction du domaine de test](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain) : limitation aux destinataires de test du compte et nécessité d’un domaine vérifié pour les autres destinataires.

## Preuves et vérifications

Captures locales : `/workspace/artifacts/booking-ux-audit/before/` et `/workspace/artifacts/booking-ux-audit/after/`. Écrans examinés : sélection entre deux créneaux, coordonnées, confirmation, gestion, tableau de bord organisateur, apparence et réservation sur ordinateur.

Les tests doivent vérifier : distinction visuelle de la sélection, persistance au survol, action clavier, lisibilité complète du code sur mobile, copie et téléchargement, absence de débordement, conservation du billet après navigation, traitement ciblé de la confirmation, idempotence et reprise sans perte de réservation. Un contrôle d’envoi au prestataire ne vaut pas preuve de réception dans une boîte e-mail.

Résultats de la version corrigée :

- `npm run verify` : TypeScript, ESLint et 152 tests unitaires réussis.
- `npm run test:integration` : 148 tests réussis, dont l’isolation de l’envoi, la concurrence et la reprise après panne.
- Parcours navigateur ciblés : 32 tests réussis sur la compilation finale. Ils couvrent sélection, clavier, code lisible à 320/390/1280 px, copie, PDF, fermeture de page, connexion participant, simulation, annulation, intégration et calendrier.
- `npm run build` : compilation de production réussie.
- Captures avant/après : sept écrans de chaque version, sur des données fictives. Les QR et codes diffèrent car chaque série utilise sa propre réservation.
- Régression repérée puis corrigée : la précision du statut d’annulation reste visible après actualisation, sans réintroduire le récapitulatif complet en double.

Ces résultats ne constituent ni un test Safari sur appareil réel, ni une validation de réception des e-mails, ni la preuve qu’un ordonnanceur hébergé exécute les reprises. Les corrections restent sur la branche `feat/booking-clarity-and-confirmation` ; la version publiée sur Vercel n’a pas été remplacée pendant cet audit.
