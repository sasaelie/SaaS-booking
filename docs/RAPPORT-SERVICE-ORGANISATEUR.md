# Service organisateur — réalisation et vérification

Autorisation utilisateur : coder uniquement. Branche `feat/organizer-service-completion`, issue de `main` après la fusion de la PR 9. Aucun déploiement, modification Supabase hébergée, envoi réel ou encaissement effectué.

Plan de référence : [PLAN-SERVICE-ORGANISATEUR.md](PLAN-SERVICE-ORGANISATEUR.md).

## Réalisation

| Besoin | Comportement |
|---|---|
| Réseaux | Réglages → Réseaux et contact : WhatsApp, Facebook, Instagram, YouTube, TikTok et site. Liens HTTPS facultatifs, affichés sur catalogue et réservation avec nom accessible et ouverture séparée. Aucun mot de passe de réseau social. |
| Détails | Création/modification d’activité → Détails pratiques : adresse ou lien, visibilité immédiate/différée, consignes et texte complémentaire de participation. Groupe repliable pour garder le formulaire simple. |
| Adresse différée | Le champ adresse est supprimé de la projection publique, y compris HTML/RSC. Le participant voit la promesse de communication à 24 h. Une adresse encore absente est signalée dans la liste des activités. |
| Conditions | Consultation dès le choix de séance, lien depuis les cases d’acceptation. Le texte complémentaire s’ajoute aux règles automatiquement appliquées, dont délai et durée de report paramétrables. Texte et paramètres acceptés sont conservés par réservation. |
| Codes manuels | Depuis une réservation annulée par le participant : attribution confirmée de la valeur éligible, expiration proposée à deux mois et modifiable avant création, historique administratif, code copiable. Pas de crédit sur une réservation impayée, remboursée ou dont le crédit initial a été libéré. |
| Reliquat | Ancien code consommé ; nouveau code pour la différence, avec expiration héritée, créé dans la transaction de confirmation. Un code verrouillé en attente de complément ne produit pas de reliquat anticipé. |
| Confirmation | Contenu enrichi avec résumé, horaires et fuseau, consignes, règlement reçu/restant et gestion de réservation. Adresse masquée dans une confirmation précoce si elle doit être différée ; incluse à moins de 24 h. |
| Rappel | Planifié par le travailleur existant pour les confirmations antérieures au seuil de 24 h. Pas de rappel aux annulés ou réservations tardives ; clé liée à la réservation et à la date de séance ; ancien horaire ignoré. |
| Changements pratiques | Une modification d’adresse, de visibilité ou de consignes crée une notification de mise à jour pour les réservations confirmées à venir. Le contrôle de divulgation de l’adresse reste appliqué au moment de préparer le message. |
| Indicateurs | Pastille et libellé distincts pour règlement attendu, justificatif, payé, gratuit, couvert par code et annulation. Administration : accès actif/offert, fin effective dans les sept jours, terminé/suspendu, à activer. Un renouvellement automatique normal reste vert. |
| Filtres | Règlements attendus, paiements reçus, réservations couvertes par code et délais dépassés, toujours limités à l’organisation autorisée. |

## Données et migration

Migrations applicatives additives `013_organizer_service.sql` et `014_default_voucher_validity.sql`, exécutées uniquement sur `booking_test` local. La durée proposée pour les nouvelles activités devient deux mois ; aucune durée des activités existantes n’est réécrite. Les tables privées existantes gardent leurs protections ; aucun accès client ni nouvelle table exposée.

La migration reprend les délais et durées des anciennes réservations depuis le texte accepté lorsqu’il contient les formulations générées historiques, avec repli sur les paramètres de l’activité lorsque cette information n’est pas extractible. Elle ne prétend pas reconstruire des paramètres historiques absents du texte. Les nouvelles réservations conservent explicitement ces valeurs.

La contrainte d’un code d’annulation par réservation devient un index unique partiel ; un index distinct garantit un seul reliquat par code source. La filiation conserve la clé d’organisation. Une collision sur le texte du code reste une erreur de transaction : la réservation et la consommation sont annulées, pour permettre une reprise sans perdre de valeur.

## Validation

Résultat final local : **154 cas réussis**, soit 52 tests unitaires, 73 tests PostgreSQL et 29 parcours Chromium, sans test ignoré ou instable. TypeScript strict, ESLint, compilation Next.js staging et synthèse des rapports réussis.

Captures de la version locale avec données fictives : [page participant](previews/saas/service-participant-mobile.png) et [fiche et code de report](previews/saas/service-code-mobile.png).

- TypeScript strict, ESLint, tests unitaires et compilation staging.
- PostgreSQL réel local : isolation des liens et filtres, adresse différée, règles et texte figés, rappel et réservation tardive, annulation et ancien horaire, génération manuelle, concurrence et conservation des crédits, expiration refusée, collision de code et reprise.
- Chromium : sauvegarde des réseaux et détails par les interfaces authentifiées, contrôle de l’absence d’adresse dans le HTML, lecture des conditions, génération d’un code depuis la fiche participant et persistance après rechargement. Régression des parcours existants conservée.
- Tailles 320/390/1280 px pour le nouveau parcours public ; contrôles mobiles et ordinateur existants pour les consoles ; captures et traces dans `test-results/`.
- Rapports JSON et synthèse stricte dans `qa-results/`, exclus de Git. La commande `npm run test:summary` refuse échecs, absences de rapport, tests ignorés ou instables.

## Limites d’exploitation

Les rappels dépendent de l’appel périodique authentifié du travailleur `/api/jobs`. Le code prépare et déduplique les traitements ; il ne raccorde pas un ordonnanceur hébergé et ne certifie pas une livraison dans la boîte de réception à une seconde précise. Les limites de volume/fréquence et les événements de livraison devront être vérifiés lors du raccordement réel.

Les envois utilisent le transport Resend existant et ses reprises. Les tests utilisent des doublures ; aucune des confirmations en attente sur la recette hébergée n’a été déclenchée. Domaine d’envoi, restrictions de destinataires et prestataires de paiement restent ceux du projet actuel.

Le texte libre de participation ne constitue pas un moteur de règles : les traitements automatiques suivent les paramètres structurés affichés. Les paiements sur place ne sont pas déclarés encaissés automatiquement, et la génération manuelle ne sert pas à fabriquer une preuve de règlement.
