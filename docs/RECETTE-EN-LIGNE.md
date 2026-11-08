# Recette privée en ligne

## Adresse et version

- Adresse stable : https://saas-booking-recette-elis-projects-ddf0bd9d.vercel.app
- Inscription : https://saas-booking-recette-elis-projects-ddf0bd9d.vercel.app/inscription
- Déploiement Vercel Preview actuel : `dpl_2AwWxUpMgrN3WabUsTwz5Lwx6VRt`, état READY, avec la correction du lien de réservation.
- Commit applicatif : `6b470fbe506170d81530cefb7b09cfe9de6063ec`, branche `feat/staging-environment`.
- L’alias stable pointe sur ce déploiement ; `NEXT_PUBLIC_APP_URL` est configuré pour cette adresse dans Preview.
- Protection Vercel Authentication conservée. Se connecter avec le compte Vercel autorisé pour accéder à la recette. Aucun domaine acheté, aucune promotion en production et aucune fusion de la PR 4.

## Contrôles effectués

- Compilation Vercel de l’application complète réussie, avec Node 24 et fonctions configurées dans la région `arn1`.
- Page d’inscription : réponse HTTP 200, formulaire présent et bandeau d’environnement de test visible.
- `/api/auth/get-session` : réponse HTTP 200 et session nulle sans utilisateur connecté, sans erreur de configuration.
- Connexion SQL Vercel → Supabase préalablement vérifiée avec TLS strict et lecture des neuf migrations.
- Expéditeur Resend de test et clé limitée à l’envoi configurés en Preview. Un e-mail transactionnel envoyé via le connecteur Resend a été livré et sa réception confirmée par le propriétaire. L’envoi déclenché par l’inscription dans l’application reste à valider.
- Contrôle de la base au lancement : aucun compte ni organisation. Aucun compte privilégié ou mot de passe prédéfini ajouté.

## Première utilisation

Le formulaire de création d’espace distingue maintenant le **nom du lien de réservation** d’une adresse postale. Il suggère un lien à partir du nom de l’organisation, en retire accents et espaces, affiche un aperçu et conserve les personnalisations. Les valeurs incorrectes ou réservées sont expliquées en français sous le champ. Le serveur conserve sa validation et le contrôle d’unicité ; la suggestion ne garantit pas qu’un lien soit disponible.

Cette correction est vérifiée par un parcours mobile couvrant la suggestion, la saisie incorrecte, les noms réservés et la création effective d’un espace. Les dix autres parcours navigateur, les 42 tests unitaires, les 41 tests PostgreSQL et la compilation ont également été vérifiés pendant cette modification.

Les écrans vides affichent désormais une seule action principale : le bouton supérieur « Créer un espace » est retiré quand aucune organisation n’existe. La première activité se crée depuis un bouton dans sa carte ; les compteurs à zéro sont masqués avant cette première activité. Sans accès actif, la carte explique le blocage et dirige vers la gestion de l’accès, avec un message de recette distinct d’une demande d’abonnement payant. Les contrôles métier restent inchangés. Un accès offert de recette a été accordé à l’unique espace concerné du propriétaire après vérification de son identité de propriétaire et de son compte validé ; l’opération est journalisée et n’active aucune facturation.

Validation de cette correction : 42 tests unitaires, 41 tests PostgreSQL, compilation et 12 parcours navigateur réussis, dont le nouveau parcours mobile des écrans vides et la vérification que l’expiration continue de bloquer les nouvelles activités côté serveur.

1. Ouvrir l’adresse d’inscription et passer la protection Vercel si elle apparaît.
2. S’inscrire avec **l’adresse du compte Resend**, seul destinataire réel autorisé par l’expéditeur `resend.dev` sans domaine vérifié.
3. Choisir soi-même un mot de passe, non communiqué dans le chat.
4. Ouvrir le vrai message de validation et suivre son lien, puis se connecter à l’application.
5. Après vérification du compte et choix explicite de l’administrateur par le propriétaire, attribuer les droits plateforme par le processus existant. Les nouveaux espaces n’obtiennent aucun abonnement actif automatiquement ; un accès offert de recette peut être accordé par l’administrateur et reste journalisé.
6. Créer et publier une activité sans paiement en ligne pour tester les inscriptions. Ne pas entrer de vraies données clients pendant cette recette.

## Ce qui reste à raccorder

- Stockage S3 privé : identifiants, bucket, lecture temporaire et suppression à vérifier avec `npm run check:storage`. Les logos, fonds et preuves de virement ne sont pas encore validés sur un stockage réel.
- Ordonnanceur : `POST /api/jobs` doit être exécuté avec authentification pour délivrer les confirmations en file, codes de report et reprises. La clé est préparée, mais aucun ordonnanceur actif n’est attesté. Ne pas confondre l’e-mail d’authentification, envoyé directement, avec les notifications différées de réservation.
- Inscription, vérification de l’e-mail, création d’activité, réservation et annulation : recette complète hébergée encore à réaliser avec le propriétaire.
- Domaine d’envoi vérifié nécessaire avant d’accueillir plusieurs destinataires. Les paiements Stripe/Mollie et abonnements facturés restent désactivés.

Cette adresse est un environnement privé de recette, pas une mise en service commerciale. Les règles et limites de la formule Vercel devront être revues avant l’ouverture commerciale. Aucun abonnement payant n’a été activé.
