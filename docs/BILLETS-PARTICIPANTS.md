# Billets et espace participant

Chaque réservation confirmée dispose d’un code client et d’un QR code. Le code ouvre uniquement son dossier, sans compte participant ni rôle organisateur. Une réservation en attente de paiement conserve sa page de suivi mais ne reçoit pas de billet confirmé.

## Parcours

- Le billet apparaît dans le résultat de réservation et dans la page de gestion. Il comporte l’activité, l’organisation, le participant, la séance, le prix réservé, le montant encaissé, la part couverte par un report, l’éventuel reste à régler, le statut, le code et le QR.
- Le bouton « Télécharger le billet PDF » produit un véritable fichier PDF, y compris en simulation. Il ne dépend pas de `window.print()`, qui peut rester sans effet sur mobile. Le téléchargement démarre au clic ; un lien natif reste disponible si le navigateur exige un second geste. Le PDF peut ensuite être imprimé depuis son lecteur. Un fichier enregistré reste une copie historique ; le QR permet de consulter le statut actuel.
- Le retour de paiement ouvre le suivi. La confirmation reste exclusivement déterminée par le serveur et le fournisseur de paiement ; le retour du navigateur ne confirme jamais la place.
- La connexion propose Organisateur / Participant. Le code participant n’authentifie pas un organisateur et ne remplace pas sa session.
- Le dossier permet l’annulation selon les règles existantes, l’accès aux reports, aux contacts publics et aux informations pratiques. L’adresse configurée REMINDER reste cachée jusqu’à 24 heures avant la séance.
- Un organisateur autorisé peut retrouver le code depuis la fiche de réservation. Cette consultation est journalisée. Aucun accès public par recherche de nom ou d’adresse e-mail n’est ajouté.

## Validité

L’accès n’expire pas simplement parce que la séance est passée. Il se ferme lorsque la séance est terminée **et** qu’un report du dossier a effectivement été consommé, sans autre crédit disponible ou engagé encore valable attaché au dossier. L’émission d’un report et son verrouillage en attente de paiement ne constituent pas une consommation définitive.

L’absence de report n’accorde aucun crédit automatiquement. Un report expiré reste expiré même si le dossier est encore consultable. Un billet annulé ou passé ne permet plus d’entrer à une nouvelle séance.

Un nouveau billet est émis pour la nouvelle réservation. Les reliquats existants sont rattachés à celle-ci par le moteur de report. Si un nouveau crédit autorisé est accordé après la fermeture d’un dossier, le droit client est renouvelé explicitement : nouvel identifiant, nouvelle version, anciennes sessions supprimées, ancien code définitivement invalide. Le courriel de report contient l’accès actuel lorsqu’il existe.

La révocation, une demande d’effacement autorisée ou la suppression d’un test peuvent invalider l’accès indépendamment de ces conditions. Une modification de date ne réactive pas un code déjà clôturé.

## Implémentation et sécurité

- Migrations `020_participant_access.sql`, `021_story_layout.sql`, `022_participant_credit_recovery.sql`, exécutées avec le migrateur existant. Les structures et les déclencheurs de simulation sont explicitement étendus.
- Tables privées `booking_access_credentials`, `participant_booking_sessions`, `booking_access_events`, clés étrangères composites réservation/organisation, index et RLS, sans droits PUBLIC/anon/authenticated.
- Un déclencheur invoker crée l’identifiant d’accès dans la transaction de confirmation : gratuit, sans paiement, validation bancaire ou fournisseur. L’unicité par réservation rend cette émission idempotente. La migration reprend les confirmations conservées sans envoyer d’e-mails.
- Le code est une capacité signée : UUID aléatoire et signature HMAC-SHA-256 de 128 bits liant l’organisation, la réservation, la version et le contexte. Il est reconstitué sur le serveur, ce qui évite de stocker le secret utilisable, même chiffré, dans les tables. Cette dérivation remplace le stockage chiffré envisagé dans le plan initial.
- La clé serveur existante `SELF_CANCEL_HMAC_SECRET` est utilisée avec un contexte cryptographique distinct. Sa rotation invalide aussi ces codes ; elle doit donc être coordonnée avec leur réémission. Aucun secret supplémentaire n’est exposé au navigateur.
- Le QR contient le code dans le fragment. Celui-ci est effacé avant l’échange POST. Une session opaque HttpOnly, SameSite=Strict, Secure et `__Host-` en HTTPS est ensuite utilisée ; seule son empreinte est conservée en base.
- Une indisponibilité temporaire pendant cet échange propose de réessayer avec le code conservé uniquement en mémoire, sans nouveau scan. Elle n’est pas présentée comme un code invalide. Un changement de dossier efface l’ancien contexte affiché avant de charger le nouveau.
- Plusieurs autorisations de réservation peuvent coexister dans le même navigateur ; chaque requête recontrôle le dossier demandé. Le code ne révèle pas les autres réservations d’une même adresse e-mail.
- Contrôle d’origine et limitation des essais à l’échange. Les réponses privées sont non stockables. Les routes de gestion restent non indexables et protégées contre l’encadrement.
- Les anciens liens signés restent contrôlés par la même règle de clôture, de révocation et de version. Ils conservent leur échéance cryptographique initiale ; le nouveau code est l’accès durable. Les anciens dossiers conservés sont aussi récupérables par l’organisateur autorisé.
- Les codes RPT historiques restent acceptés pour les reports mais ne deviennent jamais des identifiants de connexion. Le code client peut résoudre un report unique disponible dans la même organisation. Si plusieurs crédits sont disponibles, le participant doit choisir le code RPT dans son dossier.
- La purge automatique exclut les dossiers dont l’accès reste ouvert. Les protections comptables, les litiges et les demandes d’effacement restent distincts.

## Simulation

Les billets portent TEST. Ils utilisent le schéma isolé, la clé dérivée de simulation et le préfixe TEST. Le QR ouvre la gestion de simulation, qui exige toujours l’autorisation de l’organisateur. Un code TEST n’ouvre pas la connexion participant réelle et ne finance pas une réservation réelle. La suppression d’un test invalide son accès par anonymisation et changement de version. Aucun paiement ni courriel réel n’est produit.

## Apparence

Le voyant d’image passe au vert après la réussite de l’import côté serveur et le décodage de l’image affichée. Le rappel des formats et du poids correspond aux limites réellement acceptées : PNG/JPEG/WebP, 4 Mo.

L’apparence permet de sélectionner une activité d’aperçu et d’ouvrir directement son édition de nom et de prix. Le placement relatif du titre et du tarif est enregistré séparément dans l’identité de l’organisation et appliqué aux encarts et cartes participants. Les poignées utilisent les Pointer Events, avec commandes au clavier et curseurs équivalents ; seul le déplacement des poignées bloque le geste de défilement. Les réservations existantes conservent leur prix et leur nom enregistrés.

## Vérification et livraison

Le PDF est préparé dans le navigateur à partir du dossier déjà autorisé et affiché. Aucune nouvelle API ni permission de base de données n’est ajoutée. La bibliothèque PDF et la police Unicode locale se chargent uniquement lors du téléchargement ; la licence de la police accompagne son fichier dans `public/fonts`. La mention TEST, les statuts, les montants encaissés, les reports et le reste à régler sont conservés. Une erreur de préparation permet de réessayer ; les URL temporaires de fichier sont libérées quand le billet change ou se ferme.

Le contrôle navigateur clique réellement le bouton et vérifie le fichier téléchargé : format PDF lisible, nom distinguant TEST et réservation réelle, lien de secours utilisable, reprise après indisponibilité de la police. L’essai mobile désactive volontairement `window.print()` pour vérifier que le PDF n’en dépend pas. Ce contrôle complète celui de la mise en page d’impression.

Exécuter `npm run verify`, les tests PostgreSQL et les parcours navigateur. Les migrations ont été testées sur PostgreSQL local ; elles doivent être appliquées au schéma de recette avant d’y déployer cette version. Ne pas déployer le nouveau serveur contre une base encore dépourvue de ces tables.

Ce chantier ne modifie pas les clés de paiement et n’active aucun paiement réel. La validation locale et les captures ne constituent pas un déploiement en recette ou en production.
