# Espaces SaaS — décisions et suivi

Base : PR 1 fusionnée dans main au commit 3b330f8, nouvelle branche feat/saas-portals.

## Décisions utilisateur

- Tarif initial : 19,99 EUR par mois, sans commission de plateforme sur les réservations.
- Résiliation à tout moment : arrêt du renouvellement, tous les droits conservés jusqu’à l’échéance payée.
- Après expiration : compte et gestion des inscriptions existantes conservés ; nouvelles activités, séances et réservations bloquées.
- Réactivation : droits commerciaux restaurés selon abonnement et dates, sans effacer l’historique.
- Accès offert attribuable aux propres organisations du propriétaire, avec journal des interventions.
- Organisateurs de tout milieu, événements ponctuels et séances récurrentes.
- Conservation du design validé ; personnalisation limitée au logo et aux ambiances lisibles.
- Deux consoles séparées : organisateur et administration de la plateforme.
- Liens directs, QR code, intégration iframe et bouton flottant pour les sites existants.

## Réalisation

Les validations, ports et tests précèdent les adaptateurs et écrans. Les changements restent sur cette branche, avec une nouvelle PR à revoir avant fusion.
L’authentification utilise Better Auth, les comptes restant dans PostgreSQL ; l’e-mail doit être vérifié et la récupération de mot de passe utilise le prestataire de messagerie configuré.
L’abonnement de la plateforme dispose d’un flux Stripe distinct des paiements participants. Aucune facturation réelle n’est activée par le développement.
Les comptes et tables d’identité globaux sont distincts des tables métier, qui restent isolées par organization_id.


## Interfaces livrées

| Espace | Utilisation |
| --- | --- |
| Connexion / inscription / récupération | Compte distinct de l’organisation, e-mail vérifié, session serveur et limitation des tentatives. |
| Mes organisations | Création d’un espace avec nom, type, adresse publique et fuseau horaire. |
| Vue d’ensemble | Activités, inscriptions, virements et remboursements réels, prochaines séances et places restantes. |
| Activités | Création ponctuelle ou récurrente, tarif unique, public, téléphone, politique de report ; modification des informations, ajout de dates manuelles, pauses protégées et archivage. |
| Inscriptions | Recherche et pagination, contact, justificatif privé, validation/refus d’un virement, annulation, report dérogatoire et enregistrement d’un remboursement bancaire effectué. |
| Abonnement | Tarif, état, échéance, arrêt/reprise du renouvellement, accès aux factures Stripe. |
| Mon organisation | Logo, image d’ambiance, trois thèmes lisibles, coordonnées de virement et connexion Stripe. |
| Partager | Lien de catalogue, QR code par organisation ou activité, code d’intégration et bouton flottant. |
| Administration plateforme | Annuaire des organisations avec e-mail du responsable, compteurs, suspensions et accès offerts ; opérations en attente et historique. Voir [ADMINISTRATION.md](ADMINISTRATION.md). |

Les réservations existantes restent gérables après expiration. L’archivage ferme une activité aux nouvelles inscriptions et préserve son historique. Les modèles hebdomadaires existants restent affichés dans les détails ; les modifications d’information ne déplacent pas les séances déjà réservées.

## Première installation

1. Installer les dépendances et appliquer les migrations versionnées (voir README).
2. Configurer une base PostgreSQL en UE, une URL HTTPS, un `SELF_CANCEL_HMAC_SECRET` et un `BETTER_AUTH_SECRET` indépendants et aléatoires d’au moins 32 caractères.
3. Configurer Resend et `MAIL_FROM` sur un domaine validé. Créer le compte du propriétaire via `/inscription`, puis vérifier l’e-mail.
4. Accorder le rôle plateforme depuis un terminal administrateur autorisé :

```bash
node --env-file=.env.local --import tsx scripts/grant-platform-admin.ts proprietaire@example.com
```

La commande exige un compte déjà vérifié. Aucun utilisateur ne peut s’attribuer ce rôle depuis le site. La console plateforme ne donne pas automatiquement accès aux coordonnées des participants des autres organisations.

5. Créer vos propres espaces depuis `/app`, puis leur accorder un accès offert dans `/plateforme`. Les espaces des clients commencent sans droits commerciaux jusqu’au paiement de l’abonnement.

Un accès offert est refusé si la facturation Stripe de cet espace a déjà commencé, y compris pendant la création d’un Checkout. Il ne doit jamais laisser une facturation en cours invisible. Les changements d’accès sont journalisés et utilisent le même verrou que la facturation.

## Activer les abonnements à 19,99 EUR

Créer dans Stripe un prix récurrent **19,99 EUR / mois / quantité 1**, renseigner `STRIPE_SECRET_KEY`, `STRIPE_SAAS_PRICE_ID` et `STRIPE_SAAS_WEBHOOK_SECRET`. L’adaptateur refuse un prix différent. Configurer le portail client Stripe pour les factures et moyens de paiement ; les boutons de l’application pilotent l’arrêt/reprise du renouvellement.

Endpoint du webhook d’abonnement : `POST /api/webhooks/billing`.
Événements : `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`.

La période payée vient du fournisseur, jamais du navigateur. Les événements signés sont dédupliqués et l’état canonique est relu dans Stripe. Les checkouts ouverts sont réutilisés ; un abonnement existant ne déclenche pas un deuxième abonnement. En cas de paiement en attente ou refusé, l’interface le signale ; un clic de retour du navigateur ne vaut pas confirmation de paiement.

Le choix de TVA, les mentions de vente et la configuration fiscale de l’abonnement restent à valider avant commercialisation. Le montant saisi est le tarif de référence demandé, pas une certification fiscale.

## Encaisser les billets

Le tarif de la plateforme ne prélève aucune commission sur les réservations. Les frais Stripe restent applicables selon le contrat du prestataire.

- Chaque organisateur connecte son compte **Stripe Connect Standard** depuis les paramètres. Configurer `STRIPE_CONNECT_CLIENT_ID` et autoriser exactement `<URL_APPLICATION>/api/portal/stripe/callback` dans Stripe.
- Le retour OAuth utilise un état aléatoire à usage unique, stocké sous forme d’empreinte, lié au compte et à l’organisation, valable 10 minutes. Le compte Stripe est vérifié côté serveur avant activation.
- Configurer le webhook des comptes connectés vers `POST /api/webhooks/stripe-connect`, avec `STRIPE_CONNECT_WEBHOOK_SECRET` : `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `account.updated`, `account.application.deauthorized`.
- Les comptes non finalisés ou déconnectés ne peuvent plus ouvrir de nouvelles réservations par carte. Les paiements et remboursements existants conservent leur compte et leurs références.
- Pour ses propres espaces, le propriétaire peut choisir explicitement son compte Stripe de plateforme. Cette option exige à la fois le rôle plateforme et le rôle propriétaire de l’organisation ; elle est journalisée.
- Les paiements sur le compte de plateforme utilisent `POST /api/webhooks/stripe` et `STRIPE_WEBHOOK_SECRET`.
- Les virements exigent un IBAN avec contrôle Modulo 97, un bénéficiaire et le stockage privé. Aucun virement n’est déclaré encaissé à la simple réception d’une capture.

Les images sont réellement décodées et réencodées en PNG. Un travail de purge est persisté avant l’envoi au stockage, pour récupérer les fichiers orphelins après incident. Les médias de présentation sont exposés uniquement par un proxy limité aux clés du logo/fond de l’organisation ; il ne permet pas d’accéder aux preuves bancaires.

## Utiliser votre site existant

Dans « Partager », copier le lien, télécharger le QR code ou copier la ligne de script dans un bloc HTML autorisé par l’hébergeur. Le mode intégré affiche le formulaire ; le mode flottant ouvre une fenêtre accessible. Le participant reste sur le site d’origine ; un paiement Stripe s’ouvre dans un nouvel onglet depuis une intégration.

Seules les pages publiques `/embed/...` autorisent l’affichage dans un autre site HTTPS. Les comptes et consoles refusent l’intégration dans une iframe. Les messages de redimensionnement vérifient la source, le domaine, le type et les bornes de hauteur ; ils ne transmettent aucune coordonnée de participant. Certains abonnements WordPress/Wix ou politiques de sécurité peuvent exiger l’autorisation des scripts externes.

## Exploitation

Configurer le stockage privé, les sauvegardes, la messagerie et la tâche `POST /api/jobs` (voir OPERATIONS). Surveiller les traitements différés. Conserver l’application et les dépendances à jour. Les tables globales d’identité et d’événements fournisseur sont des exceptions explicites au partitionnement métier ; les activités, séances, réservations, accès et médias sont rattachés à une organisation.

Les tests locaux utilisent uniquement `booking_test` et refusent une autre base. Les comptes vérifiés préparés par les scénarios navigateur sont des fixtures locales, sans route de contournement dans l’application. Aucun abonnement réel ni déploiement de production n’est activé automatiquement.
